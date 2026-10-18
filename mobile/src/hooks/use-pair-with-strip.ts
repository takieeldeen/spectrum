import { useState, useRef, useCallback, useEffect } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import TcpSocket from "react-native-tcp-socket";
import WifiManager from "react-native-wifi-reborn";

export const LOCAL_SERVER_PORT = 10086;

export interface StripTelemetry {
  voltage: number;
  watts: number;
  temperature: number;
}

export interface OutletDetail {
  on: boolean;
  watts: number;
  power_mw: number;
  temperature_c: number;
}

export interface UsePairWithStripOptions {
  autoStart?: boolean;
  targetStripIp?: string | null;
  onStatusChange?: (states: Record<number, boolean>) => void;
  onTelemetryChange?: (telemetry: StripTelemetry) => void;
  onConnect?: (stripIp: string) => void;
  onDisconnect?: (stripIp: string) => void;
}

export interface UsePairWithStripReturn {
  // Connection State
  isConnected: boolean;
  isServerRunning: boolean;
  connectedStripIp: string | null;
  allConnectedIps: string[];
  phoneHomeIp: string;

  // Strip State & Telemetry
  outletStates: Record<number, boolean>;
  outletDetails: Record<number, OutletDetail>;
  telemetry: StripTelemetry;
  lastUpdated: Date | null;

  // Actions
  startServer: () => void;
  stopServer: () => void;
  toggleOutlet: (outletNumber: number, forceState?: boolean) => Promise<boolean>;
  setAllOutlets: (turnOn: boolean) => Promise<boolean>;
  requestStatus: () => Promise<boolean>;
  requestVoltage: () => Promise<boolean>;
  sendCommand: (command: string) => Promise<boolean>;
  refreshPhoneIp: () => Promise<string>;
}

/**
 * StripConnectionManager
 * Module-level singleton maintaining the TCP Server on port 10086,
 * managing connected sockets, telemetry polling, and outlet command distribution.
 * Implements the exact logic proven in explore.tsx.
 */
class StripConnectionManager {
  private static instance: StripConnectionManager;

  private server: any = null;
  public isServerRunning: boolean = false;
  private activeSockets: Map<string, any> = new Map();
  private subscribers: Set<() => void> = new Set();
  private pollInterval: any = null;

  public connectedStripIp: string | null = null;
  public phoneHomeIp: string = "";
  public lastUpdated: Date | null = null;

  public outletStates: Record<number, boolean> = {
    1: false,
    2: false,
    3: false,
    4: false,
  };

  public outletDetails: Record<number, OutletDetail> = {
    1: { on: false, watts: 0, power_mw: 0, temperature_c: 0 },
    2: { on: false, watts: 0, power_mw: 0, temperature_c: 0 },
    3: { on: false, watts: 0, power_mw: 0, temperature_c: 0 },
    4: { on: false, watts: 0, power_mw: 0, temperature_c: 0 },
  };

  public telemetry: StripTelemetry = {
    voltage: 0,
    watts: 0,
    temperature: 0,
  };

  private constructor() {}

  public static getInstance(): StripConnectionManager {
    if (!StripConnectionManager.instance) {
      StripConnectionManager.instance = new StripConnectionManager();
    }
    return StripConnectionManager.instance;
  }

  public subscribe(cb: () => void) {
    this.subscribers.add(cb);
  }

  public unsubscribe(cb: () => void) {
    this.subscribers.delete(cb);
  }

  private notify() {
    this.lastUpdated = new Date();
    this.subscribers.forEach((cb) => {
      try {
        cb();
      } catch (_) {}
    });
  }

  public getAllConnectedIps(): string[] {
    return Array.from(this.activeSockets.keys());
  }

  public getActiveSocket(targetIp?: string | null): any {
    if (targetIp && this.activeSockets.has(targetIp)) {
      return this.activeSockets.get(targetIp);
    }
    if (this.connectedStripIp && this.activeSockets.has(this.connectedStripIp)) {
      return this.activeSockets.get(this.connectedStripIp);
    }
    const sockets = Array.from(this.activeSockets.values());
    return sockets.length > 0 ? sockets[0] : null;
  }

  public async refreshPhoneIp(): Promise<string> {
    try {
      const ip = await (WifiManager as any).getIP?.();
      if (ip && ip !== "0.0.0.0") {
        this.phoneHomeIp = ip;
        this.notify();
        return ip;
      }
    } catch (_) {}
    return "";
  }

  public startServer() {
    if (this.server || this.isServerRunning) return;

    try {
      this.server = TcpSocket.createServer((socket: any) => {
        const rawIp = socket.remoteAddress || "";
        const stripIp = rawIp.replace(/^.*:/, "");
        console.log(`⚡ [StripManager] Strip connected from ${stripIp}`);

        this.activeSockets.set(stripIp, socket);
        this.connectedStripIp = stripIp;
        this.notify();

        // Immediately request initial full status and voltage (exact explore.tsx logic)
        try {
          socket.write("up:getinfo:all\r\n");
          socket.write("up:power_report:2:vol\r\n");
        } catch (_) {}

        socket.on("data", (data: any) => {
          const raw = (typeof data === "string" ? data : data.toString())
            .replace(/\0/g, "")
            .trim();
          this.handleData(raw, stripIp);
        });

        socket.on("close", () => {
          console.log(`[StripManager] Strip disconnected: ${stripIp}`);
          this.activeSockets.delete(stripIp);
          if (this.activeSockets.size === 0) {
            this.connectedStripIp = null;
          } else {
            this.connectedStripIp = Array.from(this.activeSockets.keys())[0];
          }
          this.notify();
        });

        socket.on("error", (err: any) => {
          console.warn(`[StripManager] Socket error (${stripIp}):`, err);
          this.activeSockets.delete(stripIp);
          this.notify();
        });
      });

      this.server.listen(
        { port: LOCAL_SERVER_PORT, host: "0.0.0.0", reuseAddress: true },
        () => {
          console.log(
            `📡 [StripManager] Listening for strips on port ${LOCAL_SERVER_PORT}`
          );
          this.isServerRunning = true;
          this.notify();
        }
      );

      this.server.on("error", (err: any) => {
        console.warn("[StripManager] Server error:", err);
      });

      this.startPolling();
    } catch (e) {
      console.warn("[StripManager] Could not start local TCP server:", e);
    }
  }

  public stopServer() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.activeSockets.forEach((sock) => {
      try {
        sock.destroy();
      } catch (_) {}
    });
    this.activeSockets.clear();
    this.connectedStripIp = null;

    if (this.server) {
      try {
        this.server.close();
      } catch (_) {}
      this.server = null;
    }
    this.isServerRunning = false;
    this.notify();
  }

  private startPolling() {
    if (this.pollInterval) return;
    // Poll connected strips periodically (explore.tsx poll logic)
    this.pollInterval = setInterval(() => {
      this.activeSockets.forEach((sock) => {
        if (sock && !sock.destroyed) {
          try {
            sock.write("up:getinfo:all\r\n");
            sock.write("up:power_report:2:vol\r\n");
          } catch (_) {}
        }
      });
    }, 3500);
  }

  private handleData(raw: string, stripIp: string) {
    if (!raw) return;

    // 1. Voltage report: up:power_report:2:XXXXX
    const voltMatch = raw.match(/up:power_report:2:(\d+)/i);
    if (voltMatch) {
      const val = Number(voltMatch[1]);
      if (val >= 50000) {
        this.telemetry.voltage = Math.round(val / 1000);
        this.notify();
      }
    }

    // 2. Physical button press events: up:event:onoff:<1-4>:<on|off>
    const eventMatch = raw.match(/up:event:onoff:([1-4]):(on|off)/i);
    if (eventMatch) {
      const ch = parseInt(eventMatch[1], 10);
      const isOn = eventMatch[2].toLowerCase() === "on";
      this.outletStates[ch] = isOn;
      if (this.outletDetails[ch]) {
        this.outletDetails[ch].on = isOn;
      }
      this.notify();

      // Request fresh full status after hardware click
      const sock = this.activeSockets.get(stripIp);
      if (sock && !sock.destroyed) {
        try {
          sock.write("up:getinfo:all\r\n");
        } catch (_) {}
      }
    }

    // 3. Complete info report: up:getinfo:...
    if (raw.includes("up:getinfo:")) {
      let totalPower_mW = 0;
      let temp_c = 0;
      let hasUpdate = false;

      for (let i = 1; i <= 4; i++) {
        const regex = new RegExp(`${i}:([^:]+)`, "i");
        const match = raw.match(regex);
        if (match) {
          const parts = match[1].split(";");
          const relay = parts[1]?.toLowerCase();
          const isOn = relay === "on";
          const power_mW = parseInt(parts[5] || "0", 10);
          temp_c = parseInt(parts[11] || "0", 10);

          this.outletStates[i] = isOn;
          totalPower_mW += power_mW;
          this.outletDetails[i] = {
            on: isOn,
            watts: Math.round(power_mW / 1000),
            power_mw: power_mW,
            temperature_c: temp_c,
          };
          hasUpdate = true;
        }
      }

      if (hasUpdate) {
        this.telemetry.watts = Math.round(totalPower_mW / 1000);
        this.telemetry.temperature = temp_c;
        this.notify();
      }
    }
  }

  public async toggleOutlet(
    outletNum: number,
    forceState?: boolean,
    targetIp?: string | null
  ): Promise<boolean> {
    const socket = this.getActiveSocket(targetIp);
    if (!socket || socket.destroyed) {
      console.warn("[StripManager] No strip connected to send toggle command.");
      return false;
    }

    const currentState = this.outletStates[outletNum] ?? false;
    const nextState = forceState !== undefined ? forceState : !currentState;
    const cmd = `up:onoff:${outletNum}:${nextState ? "on" : "off"}\r\n`;

    try {
      socket.write(cmd);
      this.outletStates[outletNum] = nextState;
      if (this.outletDetails[outletNum]) {
        this.outletDetails[outletNum].on = nextState;
      }
      this.notify();

      // Request fresh state verification after 350ms (exact explore.tsx logic)
      setTimeout(() => {
        try {
          if (!socket.destroyed) {
            socket.write("up:getinfo:all\r\n");
          }
        } catch (_) {}
      }, 350);

      return true;
    } catch (e: any) {
      console.warn("[StripManager] Failed to send toggle command:", e);
      return false;
    }
  }

  public async setAllOutlets(
    turnOn: boolean,
    targetIp?: string | null
  ): Promise<boolean> {
    const socket = this.getActiveSocket(targetIp);
    if (!socket || socket.destroyed) return false;

    try {
      for (let i = 1; i <= 4; i++) {
        socket.write(`up:onoff:${i}:${turnOn ? "on" : "off"}\r\n`);
        this.outletStates[i] = turnOn;
        if (this.outletDetails[i]) {
          this.outletDetails[i].on = turnOn;
        }
      }
      this.notify();

      setTimeout(() => {
        try {
          if (!socket.destroyed) {
            socket.write("up:getinfo:all\r\n");
          }
        } catch (_) {}
      }, 400);

      return true;
    } catch (e) {
      console.warn("[StripManager] Failed to set all outlets:", e);
      return false;
    }
  }

  public async sendCommand(
    command: string,
    targetIp?: string | null
  ): Promise<boolean> {
    const socket = this.getActiveSocket(targetIp);
    if (!socket || socket.destroyed) return false;
    try {
      const cmd = command.endsWith("\r\n") ? command : `${command}\r\n`;
      socket.write(cmd);
      return true;
    } catch (_) {
      return false;
    }
  }

  public async requestStatus(targetIp?: string | null): Promise<boolean> {
    return this.sendCommand("up:getinfo:all", targetIp);
  }

  public async requestVoltage(targetIp?: string | null): Promise<boolean> {
    return this.sendCommand("up:power_report:2:vol", targetIp);
  }
}

export const stripConnectionManager = StripConnectionManager.getInstance();

/**
 * usePairWithStrip
 * Hook to pair, communicate with, query on-demand status, and send commands to
 * power strips connected to the local network (listening on port 10086).
 * Based directly on the local direct control logic in explore.tsx.
 */
export function usePairWithStrip(
  options: UsePairWithStripOptions = {}
): UsePairWithStripReturn {
  const {
    autoStart = false,
    targetStripIp,
    onStatusChange,
    onTelemetryChange,
    onConnect,
    onDisconnect,
  } = options;

  const manager = stripConnectionManager;

  const [, setVersion] = useState(0);

  const callbacksRef = useRef({
    onStatusChange,
    onTelemetryChange,
    onConnect,
    onDisconnect,
  });
  callbacksRef.current = {
    onStatusChange,
    onTelemetryChange,
    onConnect,
    onDisconnect,
  };

  useEffect(() => {
    const handleUpdate = () => {
      setVersion((v) => v + 1);
      callbacksRef.current.onStatusChange?.(manager.outletStates);
      callbacksRef.current.onTelemetryChange?.(manager.telemetry);
      if (manager.connectedStripIp) {
        callbacksRef.current.onConnect?.(manager.connectedStripIp);
      }
    };

    manager.subscribe(handleUpdate);

    if (autoStart) {
      manager.startServer();
    }

    return () => {
      manager.unsubscribe(handleUpdate);
    };
  }, [autoStart, manager]);

  const isConnected =
    Boolean(manager.connectedStripIp) || manager.getAllConnectedIps().length > 0;

  const toggleOutlet = useCallback(
    async (outletNumber: number, forceState?: boolean): Promise<boolean> => {
      return manager.toggleOutlet(outletNumber, forceState, targetStripIp);
    },
    [manager, targetStripIp]
  );

  const setAllOutlets = useCallback(
    async (turnOn: boolean): Promise<boolean> => {
      return manager.setAllOutlets(turnOn, targetStripIp);
    },
    [manager, targetStripIp]
  );

  const requestStatus = useCallback(async (): Promise<boolean> => {
    return manager.requestStatus(targetStripIp);
  }, [manager, targetStripIp]);

  const requestVoltage = useCallback(async (): Promise<boolean> => {
    return manager.requestVoltage(targetStripIp);
  }, [manager, targetStripIp]);

  const sendCommand = useCallback(
    async (command: string): Promise<boolean> => {
      return manager.sendCommand(command, targetStripIp);
    },
    [manager, targetStripIp]
  );

  const refreshPhoneIp = useCallback(async (): Promise<string> => {
    return manager.refreshPhoneIp();
  }, [manager]);

  const startServer = useCallback(() => {
    manager.startServer();
  }, [manager]);

  const stopServer = useCallback(() => {
    // Only stop if explicitly invoked
    manager.stopServer();
  }, [manager]);

  return {
    isConnected,
    isServerRunning: manager.isServerRunning,
    connectedStripIp: manager.connectedStripIp,
    allConnectedIps: manager.getAllConnectedIps(),
    phoneHomeIp: manager.phoneHomeIp,
    outletStates: manager.outletStates,
    outletDetails: manager.outletDetails,
    telemetry: manager.telemetry,
    lastUpdated: manager.lastUpdated,
    startServer,
    stopServer,
    toggleOutlet,
    setAllOutlets,
    requestStatus,
    requestVoltage,
    sendCommand,
    refreshPhoneIp,
  };
}
