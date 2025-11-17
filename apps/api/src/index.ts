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
import { exportRoutes } from "./routes/export";
import { invitationsRoutes } from "./routes/invitations";

async function buildServer() {
  const app = Fastify({ logger: true });

  // ✅ CORS must be registered before routes & hooks
  await app.register(cors, {
    // In dev, you can keep this permissive. For prod, replace with an array like:
    // origin: ["http://localhost:5173", "https://yourdomain.com"]
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // ✅ allow PATCH
    allowedHeaders: ["Content-Type", "Authorization"], // ✅ allow bearer token
    credentials: true,
  });

  initFirebase();
  await initDb();

  // ✅ Auth hook: bypass for public routes AND for preflight (OPTIONS)
  app.addHook("preHandler", async (req, reply) => {
    if (req.method === "OPTIONS") return; // let CORS handle preflight
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
  await app.register(exportRoutes);
  await app.register(invitationsRoutes);

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
