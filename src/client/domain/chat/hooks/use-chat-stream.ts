"use client";

import { useChat } from "@ai-sdk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import type { UIMessage } from "ai";
import { ErrorCode } from "@/shared/errors";
import { toastErrorFrom } from "@/client/lib/toast";

/** Fetch persisted conversation from GET /api/chat */
async function fetchChatHistory(): Promise<UIMessage[]> {
  const res = await fetch("/api/chat");
  if (!res.ok) return [];
  const data = await res.json();
  return (data.messages ?? []) as UIMessage[];
}

export function useChatStream() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");

  // Load persisted messages on mount
  const { data: initialMessages, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["chat-history"],
    queryFn: fetchChatHistory,
    staleTime: Infinity,       // only fetch once per session
    refetchOnWindowFocus: false,
  });

  const { messages, sendMessage: send, status, error } = useChat({
    // Hydrate with persisted conversation
    messages: initialMessages,
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: Error) => {
      console.error("Chat error:", err);
      toastErrorFrom(err, ErrorCode.CHAT_STREAM_FAILED);
    },
  });

  const isLoading = isLoadingHistory || status === "streaming" || status === "submitted";

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;
      send({ text: input });
      setInput("");
    },
    [input, send]
  );

  const sendMessage = useCallback(
    (message: string) => {
      if (!message.trim()) return;
      send({ text: message });
    },
    [send]
  );

  return {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    isLoadingHistory,
    error,
    sendMessage,
  };
}
