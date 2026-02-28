import { desc, eq } from "drizzle-orm";
import { messages, conversations } from "./chat.schema";
import type { Database } from "../../db";
import type { UIMessage } from "ai";

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

  /** Save the full UIMessage[] conversation snapshot for a user/session. */
  async saveConversation(uiMessages: UIMessage[], chatId: string) {
    const json = JSON.stringify(uiMessages);
    const now = new Date().toISOString();

    // Upsert: try insert, on conflict update
    const existing = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, chatId))
      .limit(1);

    if (existing.length > 0) {
      await this.db
        .update(conversations)
        .set({ messagesJson: json, updatedAt: now })
        .where(eq(conversations.id, chatId));
    } else {
      await this.db.insert(conversations).values({
        id: chatId,
        messagesJson: json,
        updatedAt: now,
      });
    }
  }

  /** Load the full UIMessage[] conversation snapshot for a user/session. */
  async loadConversation(chatId: string): Promise<UIMessage[]> {
    const rows = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, chatId))
      .limit(1);

    if (rows.length === 0) return [];

    try {
      return JSON.parse(rows[0].messagesJson) as UIMessage[];
    } catch {
      return [];
    }
  }

  async deleteAll() {
    await this.db.delete(messages);
    await this.db.delete(conversations);
  }
}
