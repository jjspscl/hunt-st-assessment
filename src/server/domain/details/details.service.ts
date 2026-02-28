import { DetailsRepository } from "./details.repository";
import type { TaskDetail } from "@/shared/types";

export class DetailsService {
  constructor(private repo: DetailsRepository) {}

  async getDetails(taskId: string): Promise<TaskDetail[]> {
    const rows = await this.repo.findByTaskId(taskId);
    return rows.map(this.toDetail);
  }

  async attachDetail(taskId: string, content: string): Promise<TaskDetail> {
    const id = crypto.randomUUID();
    const row = await this.repo.create(id, taskId, content);
    return this.toDetail(row!);
  }

  private toDetail(row: {
    id: string;
    taskId: string;
    content: string;
    createdAt: string;
  }): TaskDetail {
    return {
      id: row.id,
      taskId: row.taskId,
      content: row.content,
      createdAt: row.createdAt,
    };
  }
}
