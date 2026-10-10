import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import hardwareService from './hardware.service';
import plugService from './plug.service';

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Allows frontend to connect
      methods: ['GET', 'POST'],
    },
  });

  // 1. Listen for internal hardware events
  // When hardware.service parses TCP data, it emits this.
  // We instantly broadcast it to ONLY the users looking at this specific plug.
  hardwareService.on('hardware_data', (payload) => {
    io.to(`plug_${payload.plugId}`).emit('live_data', payload);
  });

  // 2. Handle Frontend connections
  io.on('connection', (socket) => {
    console.log(`Frontend client connected: ${socket.id}`);

    // When user opens the details page:
    socket.on('join_plug', async (plugId: string) => {
      // Put them in a dedicated Socket.io room for this plug
      socket.join(`plug_${plugId}`);
      console.log(`Client ${socket.id} joined room plug_${plugId}`);

      try {
        // Fetch the plug's IP from the database
        const plug = await plugService.getPlugById(plugId);
        if (plug && plug.ipAddress) {
          console.log(plug.ipAddress);
          // Tell the hardware manager to open the raw TCP socket!
          hardwareService.connectToPlug(plugId, plug.ipAddress);
        }
      } catch (err) {
        console.error('Failed to connect to plug hardware on join', err);
      }
    });

    // When user clicks a button to execute a command:
    socket.on('order_plug', (data: { plugId: string; command: string }) => {
      console.log(`Received order from frontend for plug ${data.plugId}:`, data.command);
      // Forward the command directly to the TCP socket
      hardwareService.sendCommand(data.plugId, data.command);
    });

    socket.on('disconnect', () => {
      console.log(`Frontend client disconnected: ${socket.id}`);
    });
  });

  return io;
}
