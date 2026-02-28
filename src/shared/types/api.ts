import { z } from "zod";
import { taskSchema, taskDetailSchema } from "./task";

export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  });

export const taskListResponseSchema = z.object({
  tasks: z.array(taskSchema),
});

export const taskDetailResponseSchema = z.object({
  task: taskSchema,
  details: z.array(taskDetailSchema),
});

export const detailsListResponseSchema = z.object({
  details: z.array(taskDetailSchema),
});

export type TaskListResponse = z.infer<typeof taskListResponseSchema>;
export type TaskDetailResponse = z.infer<typeof taskDetailResponseSchema>;
export type DetailsListResponse = z.infer<typeof detailsListResponseSchema>;
