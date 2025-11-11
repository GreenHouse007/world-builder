import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: { uid: string; email?: string };
  }

  interface FastifyContextConfig {
    public?: boolean;
  }
}
