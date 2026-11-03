import net from "net";
import EventEmitter from "events";

class HardwareService extends EventEmitter {
  private socketBySerial = new Map<string, net.Socket>();
  private serialBySocket = new Map<net.Socket, string>();
  private plugIdsBySerial = new Map<string, Set<string>>();
  private serialByPlugId = new Map<string, string>();
  private serialByIp = new Map<string, string>();
  private pendingCommandsBySerial = new Map<string, string[]>();
  private voltageBySocket = new Map<net.Socket, number>();
  private connectedSockets = new Set<net.Socket>();
  private lastDataReceivedBySerial = new Map<string, number>();
  private lastDataReceivedByPlugId = new Map<string, number>();
  private lastPayloadBySerial = new Map<string, any>();
  private lastPayloadByPlugId = new Map<string, any>();
  private verifiedPlugIds = new Set<string>();
  private tcpServer: net.Server | null = null;
  private readonly PORT = 10086;

  constructor() {
    super();
    this.startServer();
  }

  public normalizeSerial(serial: string): string {
    return (serial || "")
      .trim()
      .toUpperCase()
      .replace(/^TONLY_TAP_/i, "")
      .replace(/[:-]/g, "");
  }

  public bindSocketToSerial(socket: net.Socket, serial: string) {
    const cleanSerial = this.normalizeSerial(serial);
    if (!cleanSerial) return;

    const existingSerial = this.serialBySocket.get(socket);
    if (existingSerial && existingSerial !== cleanSerial) {
      if (this.socketBySerial.get(existingSerial) === socket) {
        this.socketBySerial.delete(existingSerial);
        this.socketBySerial.delete(`TONLY_TAP_${existingSerial}`);
      }
    }

    this.socketBySerial.set(cleanSerial, socket);
    this.socketBySerial.set(`TONLY_TAP_${cleanSerial}`, socket);
    this.serialBySocket.set(socket, cleanSerial);

    const clientIp = socket.remoteAddress?.replace(/^.*:/, "");
    if (clientIp) {
      this.serialByIp.set(clientIp, cleanSerial);
      // Persist IP address to database so reconnected sockets can be identified immediately
      import("../models/plug.model")
        .then(({ default: PlugModel }) => {
          PlugModel.updateMany(
            {
              $or: [
                { serialNumber: cleanSerial },
                { serialNumber: `TONLY_TAP_${cleanSerial}` },
                { serialNumber: new RegExp(cleanSerial, "i") },
              ],
            },
            { ipAddress: clientIp },
          )
            .exec()
            .catch((e) => console.error("Error updating plug ipAddress:", e));
        })
        .catch(() => {});
    }

    const plugIds = this.plugIdsBySerial.get(cleanSerial);
    const count = plugIds ? plugIds.size : 0;
    console.log(
      `🔗 Strip socket bound to serial [${cleanSerial}] (IP: ${clientIp || "unknown"}, Mapped Plugs: ${count})`,
    );

    // Drain any pending commands that were queued while the strip was disconnected
    const pending = this.pendingCommandsBySerial.get(cleanSerial);
    if (pending && pending.length > 0) {
      this.pendingCommandsBySerial.delete(cleanSerial);
      console.log(
        `⚡ Draining ${pending.length} queued command(s) to strip [${cleanSerial}]`,
      );
      for (const cmd of pending) {
        if (!socket.destroyed) socket.write(cmd);
      }
    }
  }

  public async initDatabasePlugs() {
    try {
      const PlugModel = (await import("../models/plug.model")).default;
      const plugs = await PlugModel.find();
      for (const plug of plugs) {
        if (plug.serialNumber) {
          const clean = this.normalizeSerial(plug.serialNumber);
          const pId = plug._id.toString();
          if (!this.plugIdsBySerial.has(clean)) {
            this.plugIdsBySerial.set(clean, new Set());
          }
          this.plugIdsBySerial.get(clean)!.add(pId);
          this.serialByPlugId.set(pId, clean);

          if (plug.ipAddress) {
            this.serialByIp.set(plug.ipAddress, clean);
          }
        }
      }
      console.log(
        `📦 Preloaded ${plugs.length} plugs from database into memory mapping.`,
      );

      // Check if any sockets connected before DB was ready
      for (const sock of this.connectedSockets) {
        if (!sock.destroyed && !this.serialBySocket.has(sock)) {
          const clientIp = sock.remoteAddress?.replace(/^.*:/, "");
          if (clientIp && this.serialByIp.has(clientIp)) {
            const clean = this.serialByIp.get(clientIp)!;
            console.log(
              `⚡ Post-preload identified strip by IP ${clientIp} -> serial [${clean}]`,
            );
            this.bindSocketToSerial(sock, clean);
          } else {
            sock.write("up:bootinfo\r\n");
            sock.write("up:getinfo:all\r\n");
            sock.write("up:power_report:2:vol\r\n");
          }
        }
      }
    } catch (err) {
      console.error("Failed to preload plugs from DB:", err);
    }
  }

  public isSerialConnected(serial?: string): boolean {
    if (!serial) return false;
    const cleanSerial = this.normalizeSerial(serial);
    const socket =
      this.socketBySerial.get(cleanSerial) ||
      this.socketBySerial.get(`TONLY_TAP_${cleanSerial}`);
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
    const socket =
      this.socketBySerial.get(cleanSerial) ||
      this.socketBySerial.get(`TONLY_TAP_${cleanSerial}`);
    if (socket && !socket.destroyed) {
      return socket.remoteAddress?.replace(/^.*:/, "") || null;
    }
    return null;
  }

  public getStripIpByPlugId(plugId?: string): string | null {
    if (!plugId) return null;
    const serial = this.serialByPlugId.get(plugId);
    if (serial) {
      return this.getStripIpBySerial(serial);
    }
    return null;
  }

  public hasReceivedStripData(
    serialOrPlugId?: string,
    sinceTimestamp?: number,
  ): boolean {
    if (!serialOrPlugId) return false;
    const clean = this.normalizeSerial(serialOrPlugId);
    const ts =
      this.lastDataReceivedBySerial.get(clean) ||
      this.lastDataReceivedBySerial.get(`TONLY_TAP_${clean}`) ||
      this.lastDataReceivedByPlugId.get(serialOrPlugId);

    if (!ts) return false;
    if (sinceTimestamp) {
      return ts >= sinceTimestamp;
    }
    return true;
  }

  public getLastDataTimestamp(serialOrPlugId?: string): number | null {
    if (!serialOrPlugId) return null;
    const clean = this.normalizeSerial(serialOrPlugId);
    return (
      this.lastDataReceivedBySerial.get(clean) ||
      this.lastDataReceivedBySerial.get(`TONLY_TAP_${clean}`) ||
      this.lastDataReceivedByPlugId.get(serialOrPlugId) ||
      null
    );
  }

  public getLastPayload(serialOrPlugId?: string): any | null {
    if (!serialOrPlugId) return null;
    const clean = this.normalizeSerial(serialOrPlugId);
    return (
      this.lastPayloadByPlugId.get(serialOrPlugId) ||
      this.lastPayloadBySerial.get(clean) ||
      this.lastPayloadBySerial.get(`TONLY_TAP_${clean}`) ||
      null
    );
  }

  public bindPlugToSerial(plugId: string, serial: string) {
    const cleanSerial = this.normalizeSerial(serial);
    if (!cleanSerial || !plugId) return;

    if (!this.plugIdsBySerial.has(cleanSerial)) {
      this.plugIdsBySerial.set(cleanSerial, new Set());
    }
    this.plugIdsBySerial.get(cleanSerial)!.add(plugId);
    this.serialByPlugId.set(plugId, cleanSerial);
  }

  private extractSerialFromRaw(raw: string): string | null {
    // 1. Bootinfo format: up:bootinfo:<model>;<mac>;<serial>;<fw>;connect
    if (raw.includes("bootinfo")) {
      const macMatch = raw.match(
        /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})|\b([0-9A-Fa-f]{12})\b/,
      );
      if (macMatch) {
        return this.normalizeSerial(macMatch[0]);
      }
    }

    const bootMatch = raw.match(/up:bootinfo:[^;]+;([0-9A-Fa-f]{12})/i);
    if (bootMatch && bootMatch[1]) {
      return this.normalizeSerial(bootMatch[1]);
    }

    // 2. Explicit protocol formats (up:sn:XXXXX or up:mac:XXXXX)
    const explicitMatch = raw.match(/up:(?:sn|mac|dev):([a-zA-Z0-9:-]+)/i);
    if (explicitMatch && explicitMatch[1]) {
      return this.normalizeSerial(explicitMatch[1]);
    }

    // 3. TONLY_TAP_XXXXXX format
    const tapMatch = raw.match(/TONLY_TAP_([a-zA-Z0-9]+)/i);
    if (tapMatch && tapMatch[1]) {
      return this.normalizeSerial(tapMatch[1]);
    }

    // 4. 12-character hex MAC address (e.g. 2CFDB3C1DE06)
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

      // Check if IP is already known
      if (clientIp && this.serialByIp.has(clientIp)) {
        const knownSerial = this.serialByIp.get(clientIp)!;
        console.log(
          `⚡ Auto-identified strip by known IP ${clientIp} -> serial [${knownSerial}]`,
        );
        this.bindSocketToSerial(socket, knownSerial);
      } else {
        // Ask unidentified socket for bootinfo immediately so it identifies its serial
        console.log(
          `🔍 Unidentified strip connected from ${clientIp}. Requesting up:bootinfo...`,
        );
        socket.write("up:bootinfo\r\n");
      }

      // Ask the strip for getinfo and voltage immediately
      socket.write("up:getinfo:all\r\n");
      socket.write("up:power_report:2:vol\r\n");

      // Poll state every 4 seconds to keep power (watts) updated
      const pollInterval = setInterval(() => {
        if (!socket.destroyed) {
          if (!this.serialBySocket.has(socket)) {
            socket.write("up:bootinfo\r\n");
          }
          socket.write("up:getinfo:all\r\n");
          socket.write("up:power_report:2:vol\r\n");
        } else {
          clearInterval(pollInterval);
        }
      }, 4000);

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
            console.log(
              `⚡ Identified serial [${detectedSerial}] from raw payload from ${clientIp}`,
            );
            this.bindSocketToSerial(socket, detectedSerial);
          }
        }

        // Check DB for matching IP if still unidentified
        if (!detectedSerial && clientIp) {
          try {
            const PlugModel = (await import("../models/plug.model")).default;
            const plugByIp = await PlugModel.findOne({ ipAddress: clientIp });
            if (plugByIp && plugByIp.serialNumber) {
              detectedSerial = this.normalizeSerial(plugByIp.serialNumber);
              console.log(
                `⚡ Identified strip by DB IP match: ${clientIp} -> serial [${detectedSerial}]`,
              );
              this.bindSocketToSerial(socket, detectedSerial);
            }
          } catch (_) {}
        }

        // As soon as serial is known, mark data received timestamp so verify endpoint succeeds
        if (detectedSerial) {
          const now = Date.now();
          this.lastDataReceivedBySerial.set(detectedSerial, now);
          this.lastDataReceivedBySerial.set(`TONLY_TAP_${detectedSerial}`, now);
        }

        // 3. Find the plugIds associated with this serial
        let targetPlugIds = detectedSerial
          ? this.plugIdsBySerial.get(detectedSerial)
          : undefined;

        // Auto-lookup plugIds from database by serialNumber if not yet in memory
        if (detectedSerial && (!targetPlugIds || targetPlugIds.size === 0)) {
          try {
            const PlugModel = (await import("../models/plug.model")).default;
            const plugs = await PlugModel.find({
              $or: [
                { serialNumber: detectedSerial },
                { serialNumber: `TONLY_TAP_${detectedSerial}` },
                { serialNumber: new RegExp(detectedSerial, "i") },
              ],
            });

            for (const plug of plugs) {
              const pId = plug._id.toString();
              const serial = this.normalizeSerial(plug.serialNumber);
              this.bindPlugToSerial(pId, serial);
            }

            targetPlugIds = this.plugIdsBySerial.get(detectedSerial);
          } catch (err) {
            // Ignore DB lookup error
          }
        }

        if (!targetPlugIds || targetPlugIds.size === 0) {
          if (!detectedSerial) {
            console.warn(
              `⏳ Socket from ${clientIp} still unidentified. Re-requesting bootinfo...`,
            );
            socket.write("up:bootinfo\r\n");
          }
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

          const now = Date.now();
          if (detectedSerial) {
            this.lastDataReceivedBySerial.set(detectedSerial, now);
            this.lastDataReceivedBySerial.set(
              `TONLY_TAP_${detectedSerial}`,
              now,
            );
          }

          // Broadcast to all users/plugs connected to this physical strip
          for (const plugId of targetPlugIds) {
            this.lastDataReceivedByPlugId.set(plugId, now);

            const payload = {
              plugId,
              serialNumber: detectedSerial,
              outlets,
              raw,
              voltage: this.voltageBySocket.get(socket) || 0,
              timestamp: now,
            };

            this.lastPayloadByPlugId.set(plugId, payload);
            if (detectedSerial) {
              this.lastPayloadBySerial.set(detectedSerial, payload);
              this.lastPayloadBySerial.set(
                `TONLY_TAP_${detectedSerial}`,
                payload,
              );
            }

            this.emit("hardware_data", payload);

            if (!this.verifiedPlugIds.has(plugId)) {
              this.verifiedPlugIds.add(plugId);
              this.emit("strip_verified", payload);
            }

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

            // Evaluate sleep timers on live strip data for this plug
            import("./timer.service")
              .then(({ default: timerService }) => {
                timerService
                  .evaluateTimersForPlug(plugId, outlets)
                  .catch((err) => {
                    console.error("Error evaluating timers:", err);
                  });
              })
              .catch((err) => {
                console.error("Error loading timer service:", err);
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
        if (serial) {
          if (this.socketBySerial.get(serial) === socket) {
            this.socketBySerial.delete(serial);
          }
          const plugIds = this.plugIdsBySerial.get(serial);
          if (plugIds) {
            for (const pId of plugIds) {
              this.verifiedPlugIds.delete(pId);
            }
          }
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
    console.log(
      `Frontend joined plug ${plugId} with expected Serial ${cleanSerial}`,
    );
    if (cleanSerial) {
      this.bindPlugToSerial(plugId, cleanSerial);
    }

    let socket = cleanSerial
      ? this.socketBySerial.get(cleanSerial) ||
        this.socketBySerial.get(`TONLY_TAP_${cleanSerial}`)
      : undefined;

    if (socket && !socket.destroyed) {
      socket.write("up:getinfo:all\r\n");
      socket.write("up:power_report:2:vol\r\n");
    } else {
      // For unidentified sockets, ask for bootinfo + getinfo so they identify themselves
      for (const sock of this.connectedSockets) {
        if (!sock.destroyed && !this.serialBySocket.has(sock)) {
          console.log(
            `🔄 Probing unidentified strip socket for identity via bootinfo...`,
          );
          sock.write("up:bootinfo\r\n");
          sock.write("up:getinfo:all\r\n");
          sock.write("up:power_report:2:vol\r\n");
        }
      }
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

    let socket = cleanSerial
      ? this.socketBySerial.get(cleanSerial) ||
        this.socketBySerial.get(`TONLY_TAP_${cleanSerial}`)
      : undefined;

    if (!socket || socket.destroyed) {
      // Queue the command — it will be sent when the strip reconnects
      if (cleanSerial) {
        const queue = this.pendingCommandsBySerial.get(cleanSerial) ?? [];
        const payload = command.endsWith("\r\n") ? command : command + "\r\n";
        queue.push(payload);
        // Keep only the last 5 commands to avoid stale state buildup
        this.pendingCommandsBySerial.set(cleanSerial, queue.slice(-5));
        console.warn(
          `⏳ No socket for [${cleanSerial}] (connected strips: ${this.connectedSockets.size}). Command queued for reconnect.`,
        );
      } else {
        console.error(
          `Cannot send command. No serial resolved for plug [${plugId}] and no socket available.`,
        );
      }
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
