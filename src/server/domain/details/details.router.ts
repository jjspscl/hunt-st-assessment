import { Hono } from "hono";
import type { Env } from "../../env";
import { getDb } from "../../db";
import { DetailsRepository } from "./details.repository";
import { DetailsService } from "./details.service";

export const detailsRouter = new Hono<{ Bindings: Env }>();

// GET /api/tasks/:id/details
detailsRouter.get("/:id/details", async (c) => {
  const db = getDb(c);
  const service = new DetailsService(new DetailsRepository(db));
  const details = await service.getDetails(c.req.param("id"));
  return c.json({ details });
});
