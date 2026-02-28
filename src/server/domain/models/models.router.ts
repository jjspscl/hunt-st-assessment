import { Hono } from "hono";
import type { Env } from "../../env";
import { getDb } from "../../db";
import { ModelsRepository } from "./models.repository";
import { ModelsService } from "./models.service";

export const modelsRouter = new Hono<{ Bindings: Env }>();

// GET /api/models — list all available models
modelsRouter.get("/", async (c) => {
  const db = getDb(c);
  const service = new ModelsService(new ModelsRepository(db));
  const models = await service.list();
  const activeId = await service.getActiveModelId();
  return c.json({ models, activeId });
});

// POST /api/models/active — set the active model
modelsRouter.post("/active", async (c) => {
  const body = await c.req.json();
  const modelId = body.modelId;
  if (!modelId || typeof modelId !== "string") {
    return c.json({ error: "modelId is required" }, 400);
  }
  const db = getDb(c);
  const service = new ModelsService(new ModelsRepository(db));
  await service.setActive(modelId);
  return c.json({ success: true, activeId: modelId });
});

// POST /api/models/sync — manually trigger a sync from OpenRouter
modelsRouter.post("/sync", async (c) => {
  const db = getDb(c);
  const service = new ModelsService(new ModelsRepository(db));
  const result = await service.syncFromOpenRouter();
  return c.json({ success: true, ...result });
});
