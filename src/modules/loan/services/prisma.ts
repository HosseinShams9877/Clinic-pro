/**
 * prisma.ts — the loan feature's Prisma client singleton.
 *
 * The standard App Router pattern (PRISMA_6_STRATEGY §1): one client per
 * server instance, global-cached in dev so HMR does not exhaust SQLite
 * handles. This is the loan module's storage seam — by project convention
 * only modules' services folders may import @prisma/client, so nothing
 * else in the codebase has a path to the database.
 *
 * DATABASE_URL chooses the engine: `file:./<db>` for SQLite (dev/test)
 * or a `postgresql://` URL in production. The schema itself is engine-
 * agnostic (PRISMA_6_STRATEGY §6 multi-engine checklist).
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
