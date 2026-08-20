import { PrismaClient } from "@prisma/client";

// Singleton supaya tidak buka koneksi baru tiap kali hot-reload di dev.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
