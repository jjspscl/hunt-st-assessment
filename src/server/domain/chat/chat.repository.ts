import { eq } from "drizzle-orm";
import { messages } from "./chat.schema";
import type { Database } from "../../db";
import { desc } from "drizzle-orm";

export class ChatRepository {
  constructor(private db: Database) {}

  async saveMessage(
    id: string,
    role: "user" | "assistant" | "system",
    content: string
  ) {
    await this.db.insert(messages).values({
      id,
      role,
      content,
      createdAt: new Date().toISOString(),
    });
  }

  async getRecentMessages(limit: number = 50) {
    const rows = await this.db
      .select()
      .from(messages)
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    // Return in chronological order
    return rows.reverse();
  }

  async deleteAll() {
    await this.db.delete(messages);
  }
}
