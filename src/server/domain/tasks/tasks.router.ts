import { Hono } from "hono";
import type { Env } from "../../env";
import { getDb } from "../../db";
import { TasksRepository } from "./tasks.repository";
import { TasksService } from "./tasks.service";
import { DetailsRepository } from "../details/details.repository";
import { DetailsService } from "../details/details.service";
import { ErrorCode } from "@/shared/errors";

export const tasksRouter = new Hono<{ Bindings: Env }>();

// GET /api/tasks
tasksRouter.get("/", async (c) => {
  const db = getDb(c);
  const service = new TasksService(new TasksRepository(db));
  const tasks = await service.listTasks();
  return c.json({ tasks });
});

// GET /api/tasks/:id
tasksRouter.get("/:id", async (c) => {
  const db = getDb(c);
  const taskService = new TasksService(new TasksRepository(db));
  const detailsService = new DetailsService(new DetailsRepository(db));

  const task = await taskService.getTask(c.req.param("id"));
  if (!task) {
    return c.json({ error: "Task not found", code: ErrorCode.TASK_NOT_FOUND }, 404);
  }

  const details = await detailsService.getDetails(task.id);
  return c.json({ task, details });
});

// PATCH /api/tasks/:id
tasksRouter.patch("/:id", async (c) => {
  const db = getDb(c);
  const service = new TasksService(new TasksRepository(db));
  const body = await c.req.json();

  if (body.status === "completed") {
    const task = await service.completeTask(c.req.param("id"));
    if (!task) {
      return c.json({ error: "Task not found", code: ErrorCode.TASK_NOT_FOUND }, 404);
    }
    return c.json({ task });
  }

  return c.json({ error: "Invalid update", code: ErrorCode.TASK_INVALID_UPDATE }, 400);
});
