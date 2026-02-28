"use client";

import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";

export function useChatStream() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");

  const { messages, sendMessage: send, status, error } = useChat({
    api: "/api/chat",
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: Error) => {
      console.error("Chat error:", err);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;
      send({ content: input });
      setInput("");
    },
    [input, send]
  );

  const sendMessage = useCallback(
    (message: string) => {
      if (!message.trim()) return;
      send({ content: message });
    },
    [send]
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
