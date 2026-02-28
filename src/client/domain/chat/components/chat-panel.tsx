"use client";

import { useChatHistory, useChatStream } from "../hooks/use-chat-stream";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ChatLoadingSkeleton } from "./chat-loading-skeleton";

export function ChatPanel() {
  const { data: history, isLoading: isLoadingHistory, isFetching } = useChatHistory();

  // Gate: don't mount the chat UI until history is resolved.
  // This prevents useChat from initialising with [] then ignoring the real data.
  if (isLoadingHistory || history === undefined) {
    return <ChatLoadingSkeleton />;
  }

  return <ChatPanelInner initialMessages={history} isFetchingHistory={isFetching} />;
}

import type { UIMessage } from "ai";

function ChatPanelInner({
  initialMessages,
  isFetchingHistory,
}: {
  initialMessages: UIMessage[];
  isFetchingHistory: boolean;
}) {
  const { messages, input, setInput, handleSubmit, isLoading } =
    useChatStream(initialMessages);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <MessageList
        messages={messages}
        isLoading={isLoading}
        isFetchingHistory={isFetchingHistory}
      />
      <MessageInput
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
