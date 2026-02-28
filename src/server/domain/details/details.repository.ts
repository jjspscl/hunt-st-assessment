import { eq } from "drizzle-orm";
import { taskDetails } from "./details.schema";
import type { Database } from "../../db";

export class DetailsRepository {
  constructor(private db: Database) {}

  async findByTaskId(taskId: string) {
    return this.db
      .select()
      .from(taskDetails)
      .where(eq(taskDetails.taskId, taskId))
      .orderBy(taskDetails.createdAt);
  }

  async create(id: string, taskId: string, content: string) {
    await this.db.insert(taskDetails).values({
      id,
      taskId,
      content,
      createdAt: new Date().toISOString(),
    });
    const [detail] = await this.db
      .select()
      .from(taskDetails)
      .where(eq(taskDetails.id, id))
      .limit(1);
    return detail ?? null;
  }

  async deleteAll() {
    await this.db.delete(taskDetails);
  }
}
