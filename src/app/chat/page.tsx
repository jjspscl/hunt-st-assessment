"use client";

import { ChatPanel } from "@/client/domain/chat/components/chat-panel";

export default function ChatPage() {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <ChatPanel />
    </div>
  );
}
