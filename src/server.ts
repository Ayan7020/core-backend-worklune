import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { prisma } from "@/lib/prismInstance";
import http from "http";

const PORT = Number(process.env.PORT) || 4000;

let server: http.Server;

const startServer = async () => {
  try { 
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connected");
 
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("[Startup Error]", error);
    process.exit(1);
  }
};

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down...`);

  if (server) {
    server.close(async () => {
      console.log("HTTP server closed");

      await prisma.$disconnect();
      console.log("Prisma disconnected");

      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
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
