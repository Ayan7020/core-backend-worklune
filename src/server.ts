import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { prisma } from "@/services/prisma.service";
import Jwt, { JsonWebTokenError, JwtPayload, TokenExpiredError } from "jsonwebtoken";
import http from "http";
import { OtpQueueService } from "./utils/Queue";
import socketIo from "socket.io";
import { onConnectSocket } from "./socketFunc";

const PORT = Number(process.env.PORT) || 4000;

let server: http.Server | null = null;
let io: socketIo.Server | null = null;

const parseAllowedOrigins = (): string[] | undefined => {
  const rawOrigins = process.env.WS_ALLOWED_ORIGINS;

  if (!rawOrigins) {
    return undefined;
  }

  const origins = rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length ? origins : undefined;
};

const attachWebSocketServer = (httpServer: http.Server) => {
  const corsConfig: socketIo.ServerOptions["cors"] = {
    credentials: true,
  };

  const origins = parseAllowedOrigins();
  if (origins) {
    corsConfig.origin = origins;
  }

  const socketServer = new socketIo.Server(httpServer, {
    cors: corsConfig,
  });

  socketServer.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    onConnectSocket(socket, socketServer);

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  app.set("io", socketServer);

  return socketServer;
};

const closeHttpServer = async () => {
  if (!server) {
    return;
  }

  const activeServer = server;
  server = null;

  await new Promise<void>((resolve) => {
    activeServer.close(() => {
      console.log("HTTP server closed");
      resolve();
    });
  });
};

const closeSocketServer = async () => {
  if (!io) {
    return;
  }

  const activeServer = io;
  io = null;

  await new Promise<void>((resolve) => {
    activeServer.close(() => {
      console.log("WebSocket server closed");
      resolve();
    });
  });
};

const startServer = async () => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connected");

    await OtpQueueService.connect();

    const httpServer = http.createServer(app);
    io = attachWebSocketServer(httpServer);
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      // const payload = Jwt.verify(
      //   token,
      //   process.env.JWT_SECRET!
      // ) as { userId: string };

      socket.data.userId = token;
      next();
    })
    server = httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("[Startup Error]", error);
    await closeSocketServer();
    await closeHttpServer();
    await prisma.$disconnect();
    await OtpQueueService.close();
    process.exit(1);
  }
};

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down...`);

  try {
    await closeSocketServer();
    await closeHttpServer();

    await prisma.$disconnect();
    console.log("Prisma disconnected");

    await OtpQueueService.close();
    console.log("Email Queue Service disconnected!");

    process.exit(0);
  } catch (error) {
    console.error("[Shutdown Error]", error);
    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});

startServer();
