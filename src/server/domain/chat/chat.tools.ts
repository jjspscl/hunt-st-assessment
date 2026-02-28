import { z } from "zod";
import { tool, zodSchema } from "ai";
import { TasksService } from "../tasks/tasks.service";
import { DetailsService } from "../details/details.service";

export function createChatTools(
  tasksService: TasksService,
  detailsService: DetailsService
) {
  return {
    createTasks: tool({
      description:
        "Create one or more new tasks from the user's message. Use when the user wants to add new tasks.",
      inputSchema: zodSchema(
        z.object({
          tasks: z
            .array(
              z.object({
                title: z.string().describe("Concise task title"),
              })
            )
            .describe("Array of tasks to create"),
        })
      ),
      execute: async ({ tasks }) => {
        const created = await tasksService.createMultipleTasks(
          tasks.map((t) => t.title)
        );
        return {
          success: true,
          createdTasks: created.map((t) => ({
            id: t.id,
            title: t.title,
          })),
          message: `Created ${created.length} task(s)`,
        };
      },
    }),

    completeTasks: tool({
      description:
        "Mark one or more tasks as completed. Use when the user indicates tasks are done.",
      inputSchema: zodSchema(
        z.object({
          taskIds: z
            .array(z.string())
            .describe("IDs of tasks to mark as completed"),
        })
      ),
      execute: async ({ taskIds }) => {
        const completed = [];
        const notFound = [];
        for (const id of taskIds) {
          const task = await tasksService.completeTask(id);
          if (task) {
            completed.push({ id: task.id, title: task.title });
          } else {
            notFound.push(id);
          }
        }
        return {
          success: true,
          completedTasks: completed,
          notFound,
          message: `Completed ${completed.length} task(s)`,
        };
      },
    }),

    attachDetail: tool({
      description:
        "Attach a free-text note or detail to a single task. Use for adding context, notes, or updates to one existing task.",
      inputSchema: zodSchema(
        z.object({
          taskId: z.string().describe("ID of the task to attach the detail to"),
          content: z.string().describe("The detail/note content — include actionable steps, tips, and guidance"),
        })
      ),
      execute: async ({ taskId, content }) => {
        const detail = await detailsService.attachDetail(taskId, content);
        return {
          success: true,
          detail: { id: detail.id, taskId: detail.taskId },
          message: `Detail attached to task`,
        };
      },
    }),

    attachDetails: tool({
      description:
        "Attach notes/details to multiple tasks at once (batch). PREFERRED over calling attachDetail multiple times. Use after creating tasks to add actionable plans to each one.",
      inputSchema: zodSchema(
        z.object({
          items: z
            .array(
              z.object({
                taskId: z.string().describe("ID of the task"),
                content: z
                  .string()
                  .describe(
                    "Detailed, actionable plan for this task — include concrete steps, tips, and practical guidance"
                  ),
              })
            )
            .describe("Array of task details to attach"),
        })
      ),
      execute: async ({ items }) => {
        const results = [];
        for (const item of items) {
          const detail = await detailsService.attachDetail(
            item.taskId,
            item.content
          );
          results.push({ id: detail.id, taskId: detail.taskId });
        }
        return {
          success: true,
          attached: results.length,
          details: results,
          message: `Attached details to ${results.length} task(s)`,
        };
      },
    }),
  };
}
