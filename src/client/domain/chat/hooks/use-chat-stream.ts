"use client";

import { useChat } from "@ai-sdk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef } from "react";
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

/**
 * Hook to load the persisted chat history.
 * Returns the resolved messages array plus loading/fetching flags.
 * Must resolve BEFORE mounting useChat to avoid hydration race.
 */
export function useChatHistory() {
  return useQuery({
    queryKey: ["chat-history"],
    queryFn: fetchChatHistory,
    staleTime: 1000 * 60,         // consider fresh for 1 min
    refetchOnWindowFocus: false,   // don't disrupt mid-chat
    refetchOnMount: "always",      // always refetch on navigation / mount
  });
}

/**
 * Core chat hook — call ONLY after history has loaded (data is defined).
 * Accepts the resolved initial messages so useChat hydrates correctly
 * on every mount, including hard refresh.
 */
export function useChatStream(initialMessages: UIMessage[]) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");

  // Dedup: track last sent message + timestamp to reject rapid duplicates
  const lastSent = useRef<{ text: string; ts: number }>({ text: "", ts: 0 });

  const { messages, sendMessage: send, status, error } = useChat({
    // Hydrate with persisted conversation — always defined here
    messages: initialMessages,
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: Error) => {
      console.error("Chat error:", err);
      toastErrorFrom(err, ErrorCode.CHAT_STREAM_FAILED);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  /** Returns true if this message is a rapid duplicate and should be rejected. */
  const isDuplicate = useCallback((text: string) => {
    const now = Date.now();
    const prev = lastSent.current;
    if (prev.text === text && now - prev.ts < 10_000) return true;
    lastSent.current = { text, ts: now };
    return false;
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || isLoading || isDuplicate(text)) return;
      send({ text });
      setInput("");
    },
    [input, send, isLoading, isDuplicate]
  );

  const sendMessage = useCallback(
    (message: string) => {
      const text = message.trim();
      if (!text || isLoading || isDuplicate(text)) return;
      send({ text });
    },
    [send, isLoading, isDuplicate]
  );

  return {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,
    sendMessage,
  };
}
