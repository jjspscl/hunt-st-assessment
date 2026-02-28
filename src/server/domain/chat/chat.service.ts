import {
  streamText,
  stepCountIs,
  convertToModelMessages,
  type UIMessage,
} from "ai";
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

  async processMessages(uiMessages: UIMessage[]) {
    // Extract latest user message for idempotency + persistence
    const lastMsg = uiMessages[uiMessages.length - 1];
    const userText = lastMsg?.role === "user"
      ? lastMsg.parts?.filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text").map((p) => p.text).join("") ?? ""
      : "";

    // Idempotency check
    const idempotencyKey = await generateIdempotencyKey(userText);
    const cachedResponse = await checkIdempotencyKey(this.db, idempotencyKey);

    if (cachedResponse) {
      return {
        type: "cached" as const,
        response: cachedResponse,
        idempotencyKey,
      };
    }

    // Persist user message
    if (userText) {
      await this.chatRepo.saveMessage(crypto.randomUUID(), "user", userText);
    }

    // Build context
    const tasks = await this.tasksService.listTasks();
    const systemPrompt = buildSystemPrompt(tasks);

    // Convert UIMessages → ModelMessages (async in AI SDK v6)
    const modelMessages = await convertToModelMessages(uiMessages);

    // Create tools
    const tools = createChatTools(this.tasksService, this.detailsService);

    // Stream response
    const model = createLlmClient(this.apiKey);

    const result = streamText({
      model,
      system: systemPrompt,
      messages: modelMessages,
      tools,
      maxRetries: 3,
      stopWhen: stepCountIs(10),
      onFinish: async ({ text }) => {
        if (text) {
          await this.chatRepo.saveMessage(
            crypto.randomUUID(),
            "assistant",
            text
          );
          await storeIdempotencyKey(this.db, idempotencyKey, text);
        }
      },
    });

    return { type: "stream" as const, result, idempotencyKey };
  }
}
