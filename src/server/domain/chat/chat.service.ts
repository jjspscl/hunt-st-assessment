import { streamText, type CoreMessage } from "ai";
import { createLlmClient } from "../../lib/llm";
import { createChatTools } from "./chat.tools";
import { buildSystemPrompt } from "./chat.prompts";
import { ChatRepository } from "./chat.repository";
import { TasksRepository } from "../tasks/tasks.repository";
import { TasksService } from "../tasks/tasks.service";
import { DetailsRepository } from "../details/details.repository";
import { DetailsService } from "../details/details.service";
import {
  generateIdempotencyKey,
  checkIdempotencyKey,
  storeIdempotencyKey,
} from "../../lib/idempotency";
import type { Database } from "../../db";

export class ChatService {
  private chatRepo: ChatRepository;
  private tasksService: TasksService;
  private detailsService: DetailsService;

  constructor(private db: Database, private apiKey: string) {
    this.chatRepo = new ChatRepository(db);
    this.tasksService = new TasksService(new TasksRepository(db));
    this.detailsService = new DetailsService(new DetailsRepository(db));
  }

  async processMessage(userMessage: string) {
    // Check idempotency
    const idempotencyKey = await generateIdempotencyKey(userMessage);
    const cachedResponse = await checkIdempotencyKey(this.db, idempotencyKey);

    if (cachedResponse) {
      return {
        type: "cached" as const,
        response: cachedResponse,
        idempotencyKey,
      };
    }

    // Save user message
    await this.chatRepo.saveMessage(crypto.randomUUID(), "user", userMessage);

    // Build context
    const tasks = await this.tasksService.listTasks();
    const systemPrompt = buildSystemPrompt(tasks);
    const recentMessages = await this.chatRepo.getRecentMessages(50);

    // Build messages array for AI SDK
    const aiMessages: CoreMessage[] = recentMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Create tools
    const tools = createChatTools(this.tasksService, this.detailsService);

    // Stream response
    const model = createLlmClient(this.apiKey);

    const result = streamText({
      model,
      system: systemPrompt,
      messages: aiMessages,
      tools,
      maxSteps: 5,
      onFinish: async ({ text }) => {
        if (text) {
          // Save assistant message
          await this.chatRepo.saveMessage(
            crypto.randomUUID(),
            "assistant",
            text
          );
          // Store idempotency key
          await storeIdempotencyKey(this.db, idempotencyKey, text);
        }
      },
    });

    return { type: "stream" as const, result, idempotencyKey };
  }
}
