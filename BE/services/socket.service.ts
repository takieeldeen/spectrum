import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import hardwareService from "./hardware.service";
import plugService, { PlugService } from "./plug.service";
import metricsService from "./metrics.service";
import jwt from "jsonwebtoken";

let ioInstance: Server | null = null;

export function getIO(): Server | null {
  return ioInstance;
}

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Allows frontend to connect
      methods: ["GET", "POST"],
    },
  });
  ioInstance = io;

  io.use((socket, next) => {
    try {
      const { token } = socket.handshake.auth;
      const payload = jwt.verify(token, process.env.JWT_SECRET!);
      socket.data.user = payload;
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  // 1. Listen for internal hardware events
  // When hardware.service parses TCP data, it emits this.
  // We instantly broadcast it to ONLY the users looking at this specific plug.
  hardwareService.on("hardware_data", (payload) => {
    io.to(`plug_${payload.plugId}`).emit("live_data", payload);
    console.log(payload);
    metricsService.updateLiveTelemetry(
      payload.plugId,
      payload.outlets,
      payload.voltage,
    );
  });

  hardwareService.on("guard_triggered", (payload) => {
    console.log("📢 Broadcasting guard_triggered event to clients:", payload);
    io.to(`plug_${payload.plugId}`).emit("guard_triggered", payload);
  });

  // 2. Handle Frontend connections
  io.on("connection", (socket) => {
    const user = socket?.data?.user;
    if (user?.id) {
      socket.join(`user_${user.id}`);
      console.log(
        `Client ${socket.id} joined personal user room user_${user.id}`,
      );
    }
    console.log(`Frontend client connected: ${socket.id}`);

    // When user opens the details page:
    socket.on("join_plug", async (plugId: string) => {
      if (!PlugService.ownPlug(plugId, user.id)) {
        console.error("You don't own this plug");
        return;
      }
      // Put them in a dedicated Socket.io room for this plug
      socket.join(`plug_${plugId}`);
      console.log(`Client ${socket.id} joined room plug_${plugId}`);

      try {
        // Fetch the plug's serialNumber from the database
        const plug = await plugService.getPlugById(plugId);
        if (plug && plug.serialNumber) {
          console.log(
            `Connecting to plug ${plugId} with serial ${plug.serialNumber}`,
          );
          hardwareService.connectToPlug(plugId, plug.serialNumber);
        }
      } catch (err) {
        console.error("Failed to connect to plug hardware on join", err);
      }
    });

    // When user clicks a button to execute a command:

    socket.on("toggle_all_plugs", async (data) => {
      const { plugId, newState } = data;
      if (!(await PlugService.ownPlug(plugId, user.id))) return;

      await Promise.all(
        [1, 2, 3, 4].map((outletNum) => {
          const command = `up:onoff:${outletNum}:${newState}\r\n`;
          return hardwareService.sendCommand(plugId, command);
        }),
      );

      // Send command to refresh all outlets info
      await hardwareService.sendCommand(plugId, "up:getinfo:all\r\n");
    });

    socket.on(
      "order_plug",
      async (data: { plugId: string; command: string }) => {
        const { plugId, command } = data;
        if (!(await PlugService.ownPlug(plugId, user.id))) return;
        console.log(
          `Received order from frontend for plug ${plugId}:`,
          command,
        );
        // Forward the command directly to the TCP socket
        await hardwareService.sendCommand(plugId, command);

        // Send command to refresh info
        if (!data.command?.includes("getinfo")) {
          await hardwareService.sendCommand(data.plugId, "up:getinfo:all\r\n");
        }
      },
    );

    socket.on("disconnect", () => {
      console.log(`Frontend client disconnected: ${socket.id}`);
    });
  });

  return io;
}
