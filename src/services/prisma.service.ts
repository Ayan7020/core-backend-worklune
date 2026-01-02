import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

declare global {
  var prisma: PrismaClient | undefined;
  var pool: pg.Pool | undefined;
}

const DATABASE_URL = process.env.DATABASE_URL;
const pool = global.pool ?? new pg.Pool({ connectionString: DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  global.pool = pool;
}

const adapter = new PrismaPg(pool);

export const prisma =
  global.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
