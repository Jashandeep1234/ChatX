"use client";

import { useParams } from "next/navigation";
import { ChatPanel } from "@/components/chat/chat-panel";

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const id = params.conversationId;
  if (!id) return null;
  return <ChatPanel key={id} conversationId={id} />;
}
