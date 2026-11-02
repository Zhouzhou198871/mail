import { cache } from "react";
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const getDb = cache(() => {
  const { env } = getCloudflareContext();
  const runtime = env as unknown as { DB: ConstructorParameters<typeof PrismaD1>[0] };
  return new PrismaClient({
    adapter: new PrismaD1(runtime.DB),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
});

/**
 * Keep existing Prisma call sites intact while creating a request-scoped D1 client.
 * D1 does not support interactive transactions; callers must use idempotent writes.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, modelOrMethod: string | symbol) {
    if (modelOrMethod === "then") return undefined;
    if (modelOrMethod === Symbol.toStringTag) return "PrismaClient";

    return new Proxy(function () {}, {
      apply(_fn, _this, args: unknown[]) {
        const db = getDb();
        const method = Reflect.get(db, modelOrMethod, db);
        if (typeof method !== "function") {
          throw new Error("Unsupported Prisma client method");
        }
        return method.apply(db, args);
      },
      get(_fn, method: string | symbol) {
        if (method === "then") return undefined;
        return (...args: unknown[]) => {
          const db = getDb();
          const model = Reflect.get(db, modelOrMethod, db);
          const operation = Reflect.get(model, method, model);
          if (typeof operation !== "function") {
            throw new Error("Unsupported Prisma model operation");
          }
          return operation.apply(model, args);
        };
      },
    });
  },
});
