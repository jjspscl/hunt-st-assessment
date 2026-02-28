import { z } from "zod";

export const taskStatusSchema = z.enum(["pending", "completed"]);

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: taskStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const taskDetailSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  content: z.string(),
  createdAt: z.string(),
});

export const taskWithDetailsSchema = taskSchema.extend({
  details: z.array(taskDetailSchema),
});

export type Task = z.infer<typeof taskSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskDetail = z.infer<typeof taskDetailSchema>;
export type TaskWithDetails = z.infer<typeof taskWithDetailsSchema>;
