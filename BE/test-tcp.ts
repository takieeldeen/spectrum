import net from "net";
import readline from "readline";

const PORT = Number(process.env.TEST_TCP_PORT) || 10086;
const HOST = "0.0.0.0";
const GET_INFO_COMMAND = "up:getinfo:all\r\n";
const BOOT_INFO_COMMAND = "up:bootinfo\r\n";
const BROADCAST_INTERVAL_MS = Number(process.env.BROADCAST_INTERVAL_MS) || 5000;

const connectedSockets = new Set<net.Socket>();

/**
 * Broadcasts a string payload to all active connected sockets.
 */
function broadcast(message: string, label = "Broadcast") {
  const count = connectedSockets.size;
  if (count === 0) {
    return;
  }

  const timestamp = new Date().toISOString();
  console.log(`\n📢 [${timestamp}] ${label} to ${count} active client(s): ${JSON.stringify(message)}`);

  for (const socket of connectedSockets) {
    if (!socket.destroyed) {
      try {
        socket.write(message);
      } catch (err: any) {
        console.error(`⚠️ Failed to write to socket ${socket.remoteAddress}:${socket.remotePort}:`, err.message);
      }
    }
  }
}

const server = net.createServer((socket) => {
  const remoteAddress = socket.remoteAddress?.replace(/^.*:/, "") || socket.remoteAddress;
  const remotePort = socket.remotePort;
  const clientTag = `[${remoteAddress}:${remotePort}]`;

  connectedSockets.add(socket);
  console.log(`\n🟢 [${new Date().toISOString()}] Client connected: ${clientTag} (Total connected: ${connectedSockets.size})`);

  // Send initial getinfo and bootinfo commands upon connection
  console.log(`⚡ Sending initial info request to ${clientTag}...`);
  socket.write(BOOT_INFO_COMMAND);
  socket.write(GET_INFO_COMMAND);

  socket.on("data", (data: Buffer) => {
    const timestamp = new Date().toISOString();
    const strData = data.toString("utf-8");
    const hexData = data.toString("hex");

    console.log(`\n📥 [${timestamp}] Data received from ${clientTag}:`);
    console.log(`   Bytes: ${data.length}`);
    console.log(`   Text : ${JSON.stringify(strData)}`);
    console.log(`   Raw  : ${strData}`);
    if (data.length > 0) {
      console.log(`   Hex  : ${hexData}`);
    }
  });

  socket.on("error", (err) => {
    console.error(`⚠️  [${new Date().toISOString()}] Socket error from ${clientTag}:`, err.message);
  });

  const cleanup = (reason: string) => {
    if (connectedSockets.has(socket)) {
      connectedSockets.delete(socket);
      console.log(`🔴 [${new Date().toISOString()}] Connection ${reason} for ${clientTag} (Remaining: ${connectedSockets.size})`);
    }
  };

  socket.on("close", (hadError) => {
    cleanup(hadError ? "closed with error" : "closed");
  });

  socket.on("end", () => {
    cleanup("ended by client");
  });
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Error: Port ${PORT} is already in use.`);
    console.error(`   Make sure your backend server or another process listening on ${PORT} is stopped.\n`);
  } else {
    console.error(`\n❌ Server error:`, err);
  }
  process.exit(1);
});

// Periodic broadcast interval for getting info
const broadcastTimer = setInterval(() => {
  if (connectedSockets.size > 0) {
    broadcast(GET_INFO_COMMAND, "Periodic getinfo broadcast");
  }
}, BROADCAST_INTERVAL_MS);

// Interactive terminal input for manual commands/broadcast
if (process.stdin.isTTY) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "getinfo" || trimmed === "info") {
      broadcast(GET_INFO_COMMAND, "Manual getinfo broadcast");
    } else if (trimmed === "bootinfo") {
      broadcast(BOOT_INFO_COMMAND, "Manual bootinfo broadcast");
    } else {
      // Send raw custom command with \r\n if needed
      const cmd = trimmed.endsWith("\n") ? trimmed : `${trimmed}\r\n`;
      broadcast(cmd, `Custom command broadcast [${trimmed}]`);
    }
  });
}

server.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`🚀 TCP Test Server is listening on ${HOST}:${PORT}`);
  console.log(`📡 Automatically sends "up:getinfo:all" upon connection`);
  console.log(`📢 Broadcasting "up:getinfo:all" every ${BROADCAST_INTERVAL_MS / 1000}s to active sockets`);
  console.log(`⌨️  Press [Enter] in this terminal to broadcast getinfo anytime`);
  console.log(`🛑 Press Ctrl+C to terminate`);
  console.log(`=======================================================\n`);
});

const handleShutdown = () => {
  console.log("\n🛑 Shutting down TCP test server...");
  clearInterval(broadcastTimer);
  for (const sock of connectedSockets) {
    sock.destroy();
  }
  connectedSockets.clear();
  server.close(() => {
    console.log("Server closed. Goodbye!");
    process.exit(0);
  });
};

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);
