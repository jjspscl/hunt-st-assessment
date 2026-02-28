import { TasksRepository } from "./tasks.repository";
import type { Task } from "@/shared/types";

export class TasksService {
  constructor(private repo: TasksRepository) {}

  async listTasks(): Promise<Task[]> {
    const rows = await this.repo.findAll();
    return rows.map(this.toTask);
  }

  async getTask(id: string): Promise<Task | null> {
    const row = await this.repo.findById(id);
    return row ? this.toTask(row) : null;
  }

  async createTask(title: string): Promise<Task> {
    const id = crypto.randomUUID();
    const row = await this.repo.create(id, title);
    return this.toTask(row!);
  }

  async createMultipleTasks(titles: string[]): Promise<Task[]> {
    const results: Task[] = [];
    for (const title of titles) {
      results.push(await this.createTask(title));
    }
    return results;
  }

  async completeTask(id: string): Promise<Task | null> {
    const row = await this.repo.updateStatus(id, "completed");
    return row ? this.toTask(row) : null;
  }

  private toTask(row: {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }): Task {
    return {
      id: row.id,
      title: row.title,
      status: row.status as Task["status"],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
