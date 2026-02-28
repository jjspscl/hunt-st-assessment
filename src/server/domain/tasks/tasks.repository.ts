import { eq } from "drizzle-orm";
import { tasks } from "./tasks.schema";
import type { Database } from "../../db";

export class TasksRepository {
  constructor(private db: Database) {}

  async findAll() {
    return this.db.select().from(tasks).orderBy(tasks.createdAt);
  }

  async findById(id: string) {
    const [task] = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);
    return task ?? null;
  }

  async create(id: string, title: string) {
    const now = new Date().toISOString();
    await this.db.insert(tasks).values({
      id,
      title,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    return this.findById(id);
  }

  async updateStatus(id: string, status: "pending" | "completed") {
    await this.db
      .update(tasks)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(tasks.id, id));
    return this.findById(id);
  }

  async deleteAll() {
    await this.db.delete(tasks);
  }
}
