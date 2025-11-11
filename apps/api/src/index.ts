// apps/api/src/index.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";
import { initFirebase, verifyBearer } from "./auth";
import { initDb } from "./db";
import { healthRoutes } from "./routes/health";
import { worldsRoutes } from "./routes/worlds";
import { pagesRoutes } from "./routes/pages";
import { favoritesRoutes } from "./routes/favorites";
import { activityRoutes } from "./routes/activity";

async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

  initFirebase();
  await initDb();

  // auth hook
  app.addHook("preHandler", async (req, reply) => {
    if (req.routeOptions.config?.public) return;

    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : undefined;

    if (!token) {
      req.log.warn("No Authorization header");
      return reply.code(401).send({ error: "unauthorized" });
    }

    const decoded = await verifyBearer(token);
    if (!decoded) {
      req.log.warn("Invalid token");
      return reply.code(401).send({ error: "unauthorized" });
    }

    (req as any).user = {
      uid: decoded.uid,
      email: decoded.email ?? undefined,
    };
  });

  await app.register(healthRoutes);
  await app.register(worldsRoutes);
  await app.register(pagesRoutes);
  await app.register(favoritesRoutes);
  await app.register(activityRoutes);

  return app;
}

async function start() {
  try {
    const app = await buildServer();
    const port = Number(process.env.PORT || 3001);
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`API running on http://localhost:${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
