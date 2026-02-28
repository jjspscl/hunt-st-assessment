"use client";

import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { ErrorCode } from "@/shared/errors";
import { toastErrorFrom, toastSuccess } from "@/client/lib/toast";

export function useChatStream() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");

  const { messages, sendMessage: send, status, error } = useChat({
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: Error) => {
      console.error("Chat error:", err);
      toastErrorFrom(err, ErrorCode.CHAT_STREAM_FAILED);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

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
    error,
    sendMessage,
  };
}
