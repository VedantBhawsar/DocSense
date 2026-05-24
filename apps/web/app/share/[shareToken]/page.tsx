"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { MessageBubble, type Message } from "@/components/chat/MessageBubble";
import { FileText } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function SharedChatPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [docName, setDocName] = useState<string>("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/v1/chats/share/${shareToken}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setMessages(data.messages ?? []);
        setDocName(data.chat?.title ?? "Shared Chat");
        setState("ready");
      } catch {
        setState("error");
      }
    }
    load();
  }, [shareToken]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{docName || "Shared Chat"}</p>
            <p className="text-xs text-muted-foreground">Read-only · Shared via DocSense</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1">
        {state === "loading" && (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        )}

        {state === "error" && (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-foreground">This chat is not available</p>
            <p className="text-xs text-muted-foreground">The share link may have been revoked or is invalid.</p>
          </div>
        )}

        {state === "ready" && messages.length === 0 && (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No messages in this chat yet.
          </div>
        )}

        {state === "ready" && messages.length > 0 && (
          <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by{" "}
          <a href="/" className="font-medium text-primary hover:underline">
            DocSense
          </a>
        </p>
      </footer>
    </div>
  );
}
