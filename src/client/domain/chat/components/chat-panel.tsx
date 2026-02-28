"use client";

import { useChatStream } from "../hooks/use-chat-stream";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";

export function ChatPanel() {
  const { messages, input, setInput, handleSubmit, isLoading } =
    useChatStream();

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <MessageList messages={messages} isLoading={isLoading} />
      <MessageInput
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
