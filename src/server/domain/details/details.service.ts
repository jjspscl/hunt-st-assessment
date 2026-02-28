import { DetailsRepository } from "./details.repository";
import type { TaskDetail } from "@/shared/types";

export class DetailsService {
  constructor(private repo: DetailsRepository) {}

  async getDetails(taskId: string): Promise<TaskDetail[]> {
    const rows = await this.repo.findByTaskId(taskId);
    return rows.map(this.toDetail);
  }

  async attachDetail(taskId: string, content: string): Promise<TaskDetail> {
    // Deduplicate: skip if exact same content already attached to this task
    const exists = await this.repo.existsByContent(taskId, content);
    if (exists) {
      const existing = await this.repo.findByTaskId(taskId);
      const match = existing.find((d: { content: string }) => d.content === content);
      if (match) return this.toDetail(match);
    }

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
