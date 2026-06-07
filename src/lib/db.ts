import { PrismaClient } from "@prisma/client";

/**
 * Prisma client (singleton).
 *
 * Guarded so Next.js hot-reload doesn't spawn a new pool on every change.
 * While `USE_MOCK_DATA=true` the data layer in `@/lib/data` reads from
 * typed mock fixtures instead of hitting Prisma — but the client is wired
 * and ready for when real Postgres is connected.
 */

declare global {
  // eslint-disable-next-line no-var
  var __ee_prisma__: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__ee_prisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__ee_prisma__ = prisma;
}
