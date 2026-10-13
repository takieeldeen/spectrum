import net from "net";
import EventEmitter from "events";

class HardwareService extends EventEmitter {
  private activeConnections = new Map<string, net.Socket>();
  private ipByPlugId = new Map<string, string>();
  private voltageByIp = new Map<string, number>();
  private tcpServer: net.Server | null = null;
  private readonly PORT = 10086;

  constructor() {
    super();
    this.startServer();
  }

  private startServer() {
    this.tcpServer = net.createServer((socket) => {
      // remoteAddress usually looks like '::ffff:192.168.1.4'
      const ipAddress = socket.remoteAddress?.replace(/^.*:/, "");
      console.log(`\n⚡ Strip connected to server from ${ipAddress}!`);

      if (ipAddress) {
        this.activeConnections.set(ipAddress, socket);
      }

      // Ask the strip for current outlet states immediately
      socket.write("up:getinfo:all\r\n");

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
        if (ipAddress) {
          const voltageMatch = raw.match(/up:power_report:2:(\d+)/i);
          if (voltageMatch) {
            const value = Number(voltageMatch[1]);
            // Response is in millivolts
            if (value >= 50000) {
              this.voltageByIp.set(ipAddress, value / 1000);
            }
          }
        }

        if (!ipAddress) return;

        // Find the plugId associated with this IP
        let foundPlugId: string | undefined;

        for (const [pId, ip] of this.ipByPlugId.entries()) {
          if (ip === ipAddress) {
            foundPlugId = pId;
            break;
          }
        }

        // Auto-lookup plugId from database if not yet registered in memory
        if (!foundPlugId) {
          try {
            const PlugModel = (await import("../models/plug.model")).default;
            const plug = await PlugModel.findOne({ ipAddress });
            if (plug) {
              foundPlugId = plug._id.toString();
              this.ipByPlugId.set(foundPlugId, ipAddress);
            }
          } catch (err) {
            // Ignore DB lookup error
          }
        }

        if (!foundPlugId) {
          return;
        }

        // Parse 'up:getinfo:...' message
        if (raw.includes("up:getinfo:")) {
          const outlets: Record<string, any> = {};

          for (let i = 1; i <= 4; i++) {
            // Match:
            // 1:runtime;relay;state;overload;overheat;power;energy;previous;config;status;event;temperature
            const regex = new RegExp(`${i}:([^:]+)`, "i");
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

            const currentVoltage = this.voltageByIp.get(ipAddress) || 0;
            const power_W = power_mW / 1000;
            const current_A =
              currentVoltage > 0
                ? Number((power_W / currentVoltage).toFixed(2))
                : 0;

            outlets[`outlet${i}`] = {
              // Basic state
              on: relay === "on",

              // Runtime
              runtime,

              // State
              state,

              // Protection
              overload,
              overheat,

              // Power
              power_mW,
              power_W,
              watts: Math.round(power_W),

              // Current
              current_A,

              // Energy
              energy_kwh,

              // Previous/config values
              previous,
              config,

              // Status/event
              status,
              event,

              // Temperature
              temperature_c,

              // Keep the original protocol values
              rawParts: parts,
            };
          }
          this.emit("hardware_data", {
            plugId: foundPlugId,
            outlets,
            raw,
            voltage: this.voltageByIp.get(ipAddress) || 0,
          });

          // Evaluate guards on live strip data
          import("./guard.service")
            .then(({ default: guardService }) => {
              guardService
                .evaluateGuardsForPlug(foundPlugId!, outlets)
                .catch((err) => {
                  console.error("Error evaluating guards:", err);
                });
            })
            .catch((err) => {
              console.error("Error loading guard service:", err);
            });
        }

        // Handle physical button presses on the strip
        const eventMatch = raw.match(/up:event:onoff:([1-4]):(on|off)/i);

        if (eventMatch && foundPlugId) {
          const ch = parseInt(eventMatch[1], 10);
          const isOn = eventMatch[2].toLowerCase() === "on";

          console.log(
            `🔘 Physical button pressed: Socket ${ch} is now ${isOn ? "ON" : "OFF"}`,
          );

          if (isOn) {
            import("../models/device.model").then(
              ({ default: DeviceModel }) => {
                DeviceModel.findOneAndUpdate(
                  { plugId: foundPlugId, plugPort: ch },
                  { lastTurnedOn: new Date() },
                ).exec();
              },
            );
          }

          // Re-fetch everything to update the UI correctly
          socket.write("up:getinfo:all\r\n");
        }
      });

      socket.on("close", () => {
        console.log(`🔌 Strip disconnected from ${ipAddress}.`);
        if (ipAddress) {
          this.activeConnections.delete(ipAddress);
        }
        clearInterval(pollInterval);
      });

      socket.on("error", (err) => {
        console.error(`Socket error from ${ipAddress}:`, err.message);
      });
    });

    this.tcpServer.listen(this.PORT, "0.0.0.0", () => {
      console.log(`📡 TCP server listening for strip on port ${this.PORT}...`);
    });
  }

  /**
   * Called when frontend joins a plug room.
   */
  public connectToPlug(plugId: string, ipAddress: string) {
    console.log(`Frontend joined plug ${plugId} with expected IP ${ipAddress}`);
    this.ipByPlugId.set(plugId, ipAddress);

    // If the strip is already connected, force an immediate data refresh
    const socket = this.activeConnections.get(ipAddress);
    if (socket && !socket.destroyed) {
      socket.write("up:getinfo:all\r\n");
      socket.write("up:power_report:1:vol\r\n");
    }
  }

  /**
   * Writes commands to the hardware socket.
   */
  public sendCommand(plugId: string, command: string) {
    const ipAddress = this.ipByPlugId.get(plugId);
    if (!ipAddress) {
      console.error(`Cannot send command. No IP known for plug ${plugId}.`);
      return;
    }

    const socket = this.activeConnections.get(ipAddress);
    if (!socket || socket.destroyed) {
      console.error(
        `Cannot send command. Strip at ${ipAddress} is not connected.`,
      );
      return;
    }

    const payload = command.endsWith("\r\n") ? command : command + "\r\n";
    socket.write(payload);
    console.log(`🚀 Sent command to ${ipAddress}: ${payload.trim()}`);
  }

  public cleanupConnection(plugId: string) {
    this.ipByPlugId.delete(plugId);
  }
}

// Export as a singleton so the whole backend shares the exact same connection pool
export default new HardwareService();
