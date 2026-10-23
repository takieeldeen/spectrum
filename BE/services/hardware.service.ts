import net from "net";
import EventEmitter from "events";

class HardwareService extends EventEmitter {
  private socketBySerial = new Map<string, net.Socket>();
  private serialBySocket = new Map<net.Socket, string>();
  private plugIdsBySerial = new Map<string, Set<string>>();
  private serialByPlugId = new Map<string, string>();
  private voltageBySocket = new Map<net.Socket, number>();
  private connectedSockets = new Set<net.Socket>();
  private tcpServer: net.Server | null = null;
  private readonly PORT = 10086;

  constructor() {
    super();
    this.startServer();
  }

  public normalizeSerial(serial: string): string {
    return (serial || "").trim().toUpperCase().replace(/[:-]/g, "");
  }

  public bindSocketToSerial(socket: net.Socket, serial: string) {
    const cleanSerial = this.normalizeSerial(serial);
    if (!cleanSerial) return;

    this.socketBySerial.set(cleanSerial, socket);
    this.serialBySocket.set(socket, cleanSerial);

    const plugIds = this.plugIdsBySerial.get(cleanSerial);
    const count = plugIds ? plugIds.size : 0;
    console.log(
      `🔗 Strip socket bound to serial [${cleanSerial}] (Mapped Plugs: ${count})`,
    );
  }

  public isSerialConnected(serial?: string): boolean {
    if (!serial) return false;
    const cleanSerial = this.normalizeSerial(serial);
    const socket = this.socketBySerial.get(cleanSerial);
    return Boolean(socket && !socket.destroyed);
  }

  public isPlugConnected(plugId?: string): boolean {
    if (!plugId) return false;
    const serial = this.serialByPlugId.get(plugId);
    if (serial && this.isSerialConnected(serial)) return true;
    return false;
  }

  public getStripIpBySerial(serial?: string): string | null {
    if (!serial) return null;
    const cleanSerial = this.normalizeSerial(serial);
    const socket = this.socketBySerial.get(cleanSerial);
    if (socket && !socket.destroyed) {
      return socket.remoteAddress?.replace(/^.*:/, "") || null;
    }
    return null;
  }

  public getStripIpByPlugId(plugId?: string): string | null {
    if (!plugId) return null;
    const serial = this.serialByPlugId.get(plugId);
    return serial ? this.getStripIpBySerial(serial) : null;
  }

  public bindPlugToSerial(plugId: string, serial: string) {
    const cleanSerial = this.normalizeSerial(serial);
    if (!cleanSerial || !plugId) return;

    if (!this.plugIdsBySerial.has(cleanSerial)) {
      this.plugIdsBySerial.set(cleanSerial, new Set());
    }
    this.plugIdsBySerial.get(cleanSerial)!.add(plugId);
    this.serialByPlugId.set(plugId, cleanSerial);

    // If an anonymous connected socket exists and no socket is yet assigned to this serial, assign it
    if (
      !this.socketBySerial.has(cleanSerial) &&
      this.connectedSockets.size > 0
    ) {
      for (const sock of this.connectedSockets) {
        if (!sock.destroyed && !this.serialBySocket.has(sock)) {
          this.bindSocketToSerial(sock, cleanSerial);
          break;
        }
      }
    }
  }

  private extractSerialFromRaw(raw: string): string | null {
    // 1. Explicit protocol formats (up:sn:XXXXX or up:mac:XXXXX)
    const explicitMatch = raw.match(/up:(?:sn|mac|dev):([a-zA-Z0-9:-]+)/i);
    if (explicitMatch && explicitMatch[1]) {
      return this.normalizeSerial(explicitMatch[1]);
    }

    // 2. TONLY_TAP_XXXXXX format
    const tapMatch = raw.match(/TONLY_TAP_([a-zA-Z0-9]+)/i);
    if (tapMatch && tapMatch[1]) {
      return this.normalizeSerial(tapMatch[1]);
    }

    // 3. 12-character hex MAC address (e.g. 2CFDB3C1DE06)
    const hex12Match = raw.match(/\b([0-9A-Fa-f]{12})\b/);
    if (hex12Match && hex12Match[1]) {
      return this.normalizeSerial(hex12Match[1]);
    }

    return null;
  }

  private startServer() {
    this.tcpServer = net.createServer((socket) => {
      const clientIp = socket.remoteAddress?.replace(/^.*:/, "");
      console.log(`\n⚡ Strip connected to server from ${clientIp}!`);
      this.connectedSockets.add(socket);

      // Ask the strip for info, serial, and voltage immediately
      socket.write("up:getinfo:all\r\n");
      socket.write("up:get:sn\r\n");
      socket.write("up:get:mac\r\n");
      socket.write("up:power_report:2:vol\r\n");

      // Poll state every 3 seconds to keep power (watts) updated
      const pollInterval = setInterval(() => {
        if (!socket.destroyed) {
          socket.write("up:getinfo:all\r\n");
          socket.write("up:power_report:2:vol\r\n");
          socket.write("up:power_report:2\r\n");
        } else {
          clearInterval(pollInterval);
        }
      }, 3000);

      socket.on("data", async (data) => {
        const raw = data.toString().replace(/\0/g, "").trim();

        // 1. Voltage report
        const voltageMatch = raw.match(/up:power_report:2:(\d+)/i);
        if (voltageMatch) {
          const value = Number(voltageMatch[1]);
          if (value >= 50000) {
            this.voltageBySocket.set(socket, value / 1000);
          }
        }

        // 2. Check if this raw message reveals the strip's serial number
        let detectedSerial = this.serialBySocket.get(socket);
        if (!detectedSerial) {
          const extracted = this.extractSerialFromRaw(raw);
          if (extracted) {
            detectedSerial = extracted;
            this.bindSocketToSerial(socket, detectedSerial);
          }
        }

        // 3. Find the plugIds associated with this serial
        let targetPlugIds = detectedSerial
          ? this.plugIdsBySerial.get(detectedSerial)
          : undefined;

        // Auto-lookup plugIds from database by serialNumber if not yet in memory
        if (!targetPlugIds || targetPlugIds.size === 0) {
          try {
            const PlugModel = (await import("../models/plug.model")).default;
            let plugs: any[] = [];

            if (detectedSerial) {
              plugs = await PlugModel.find({ serialNumber: detectedSerial });
            }

            // Fallback: If only 1 strip is connected or only 1 plug exists, auto-link
            if (
              plugs.length === 0 &&
              (this.connectedSockets.size === 1 || !detectedSerial)
            ) {
              const latest = await PlugModel.findOne().sort({ updatedAt: -1 });
              if (latest) {
                detectedSerial = this.normalizeSerial(latest.serialNumber);
                this.bindSocketToSerial(socket, detectedSerial);
                plugs = await PlugModel.find({ serialNumber: detectedSerial });
              }
            }

            for (const plug of plugs) {
              const pId = plug._id.toString();
              const serial = this.normalizeSerial(plug.serialNumber);
              this.bindPlugToSerial(pId, serial);
            }

            targetPlugIds = detectedSerial
              ? this.plugIdsBySerial.get(detectedSerial)
              : undefined;
          } catch (err) {
            // Ignore DB lookup error
          }
        }

        if (!targetPlugIds || targetPlugIds.size === 0) {
          return;
        }

        // Parse 'up:getinfo:...' message
        if (raw.includes("up:getinfo:")) {
          const outlets: Record<string, any> = {};

          for (let i = 1; i <= 4; i++) {
            // Match :1:, :2:, :3:, :4: (requiring : boundary so temperatures like 23: or 24: aren't matched)
            // 1:runtime;relay;state;overload;overheat;power;energy;previous;config;status;event;temperature
            const regex = new RegExp(`(?:^|:)${i}:([^:\\r\\n]+)`, "i");
            const match = raw.match(regex);

            if (!match) continue;

            const parts = match[1].split(";");

            const runtime = parseInt(parts[0] || "0", 10);
            const relay = parts[1]?.toLowerCase();
            const state = parseInt(parts[2] || "0", 10);

            const overload = parts[3]?.toLowerCase();
            const overheat = parts[4]?.toLowerCase();

            const power_mW = parseInt(parts[5] || "0", 10);

            // Energy/previous/config are hexadecimal
            const energyRaw = parts[6] || "00000000";
            const previousRaw = parts[7] || "00000000";
            const configRaw = parts[8] || "00000000";

            const energy_kwh = parseInt(energyRaw, 16) / 1000;
            const previous = parseInt(previousRaw, 16);
            const config = parseInt(configRaw, 16);

            const status = parts[9]?.toLowerCase();
            const event = parts[10];

            const temperature_c = parseInt(parts[11] || "0", 10);

            const currentVoltage = this.voltageBySocket.get(socket) || 0;
            const power_W = power_mW / 1000;
            const current_A =
              currentVoltage > 0
                ? Number((power_W / currentVoltage).toFixed(2))
                : 0;

            outlets[`outlet${i}`] = {
              on: relay === "on",
              runtime,
              state,
              overload,
              overheat,
              power_mW,
              power_W,
              watts: Math.round(power_W),
              current_A,
              energy_kwh,
              previous,
              config,
              status,
              event,
              temperature_c,
              rawParts: parts,
            };
          }
          console.log(
            Object.values(outlets).map((outlet: any) =>
              outlet.on ? "_" : "X",
            ),
            "NEW_DATA",
          );
          // Broadcast to all users/plugs connected to this physical strip
          for (const plugId of targetPlugIds) {
            this.emit("hardware_data", {
              plugId,
              serialNumber: detectedSerial,
              outlets,
              raw,
              voltage: this.voltageBySocket.get(socket) || 0,
            });

            // Evaluate guards on live strip data for this plug
            import("./guard.service")
              .then(({ default: guardService }) => {
                guardService
                  .evaluateGuardsForPlug(plugId, outlets)
                  .catch((err) => {
                    console.error("Error evaluating guards:", err);
                  });
              })
              .catch((err) => {
                console.error("Error loading guard service:", err);
              });
          }
        }

        // Handle physical button presses on the strip
        const eventMatch = raw.match(/up:event:onoff:([1-4]):(on|off)/i);

        if (eventMatch && targetPlugIds) {
          const ch = parseInt(eventMatch[1], 10);
          const isOn = eventMatch[2].toLowerCase() === "on";

          console.log(
            `🔘 Physical button pressed: Socket ${ch} is now ${isOn ? "ON" : "OFF"}`,
          );

          if (isOn) {
            import("../models/device.model").then(
              ({ default: DeviceModel }) => {
                for (const plugId of targetPlugIds) {
                  DeviceModel.findOneAndUpdate(
                    { plugId, plugPort: ch },
                    { lastTurnedOn: new Date() },
                  ).exec();
                }
              },
            );
          }

          // Re-fetch everything to update the UI correctly
          socket.write("up:getinfo:all\r\n");
        }
      });

      socket.on("close", () => {
        const serial = this.serialBySocket.get(socket);
        console.log(`🔌 Strip disconnected ${serial ? `[${serial}]` : ""}.`);

        this.connectedSockets.delete(socket);
        this.voltageBySocket.delete(socket);
        this.serialBySocket.delete(socket);
        if (serial && this.socketBySerial.get(serial) === socket) {
          this.socketBySerial.delete(serial);
        }
        clearInterval(pollInterval);
      });

      socket.on("error", (err) => {
        const serial = this.serialBySocket.get(socket);
        console.error(
          `Socket error from strip ${serial ? `[${serial}]` : ""}:`,
          err.message,
        );
      });
    });

    this.tcpServer.listen(this.PORT, "0.0.0.0", () => {
      console.log(`📡 TCP server listening for strip on port ${this.PORT}...`);
    });
  }

  /**
   * Called when frontend joins a plug room or sends a command.
   */
  public connectToPlug(plugId: string, serialNumber: string) {
    const cleanSerial = this.normalizeSerial(serialNumber);
    if (this.socketBySerial.has(cleanSerial)) return;
    console.log(
      `Frontend joined plug ${plugId} with expected Serial ${cleanSerial}`,
    );
    this.bindPlugToSerial(plugId, cleanSerial);

    const socket = this.socketBySerial.get(cleanSerial);
    if (socket && !socket.destroyed) {
      socket.write("up:getinfo:all\r\n");
      socket.write("up:power_report:1:vol\r\n");
    }
  }

  /**
   * Writes commands to the hardware socket.
   */
  public async sendCommand(plugId: string, command: string) {
    let cleanSerial = this.serialByPlugId.get(plugId);

    // If not in memory, attempt lookup by plugId from database
    if (!cleanSerial) {
      try {
        const PlugModel = (await import("../models/plug.model")).default;
        const plug = await PlugModel.findById(plugId);
        if (plug?.serialNumber) {
          cleanSerial = this.normalizeSerial(plug.serialNumber);
          this.bindPlugToSerial(plugId, cleanSerial);
        }
      } catch (err) {
        // Ignore DB lookup error
      }
    }

    let socket = cleanSerial ? this.socketBySerial.get(cleanSerial) : undefined;

    // Fallback: If no socket is mapped to this serial, but we have connected sockets
    if (!socket || socket.destroyed) {
      if (this.connectedSockets.size > 0) {
        for (const connectedSocket of this.connectedSockets) {
          if (connectedSocket && !connectedSocket.destroyed) {
            socket = connectedSocket;
            if (cleanSerial) {
              this.bindSocketToSerial(socket, cleanSerial);
            }
            console.log(
              `⚡ Routing command for plug ${plugId} to active strip socket`,
            );
            break;
          }
        }
      }
    }

    if (!socket || socket.destroyed) {
      console.error(
        `Cannot send command. No active strip connection found for serial [${
          cleanSerial || plugId
        }] (connected strips: ${this.connectedSockets.size}).`,
      );
      return;
    }

    const payload = command.endsWith("\r\n") ? command : command + "\r\n";
    socket.write(payload);
    console.log(
      `🚀 Sent command to strip [${cleanSerial || plugId}]: ${payload.trim()}`,
    );
  }

  public cleanupConnection(plugId: string) {
    const serial = this.serialByPlugId.get(plugId);
    if (serial) {
      this.serialByPlugId.delete(plugId);
      const set = this.plugIdsBySerial.get(serial);
      if (set) {
        set.delete(plugId);
        if (set.size === 0) {
          this.plugIdsBySerial.delete(serial);
        }
      }
    }
  }
}

// Export as a singleton so the whole backend shares the exact same connection pool
export default new HardwareService();
