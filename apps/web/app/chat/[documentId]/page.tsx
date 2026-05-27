"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, AlertCircle, RotateCcw, Download, Share2, Link, X } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Message } from "@/components/chat/MessageBubble";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type ChatState = "loading" | "ready" | "error";

export default function ChatPage() {
  const { data: session } = useSession();
  const { documentId } = useParams<{ documentId: string }>();
  const router = useRouter();

  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [state, setState] = useState<ChatState>("loading");
  const [sendError, setSendError] = useState("");
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const [messageLimitReached, setMessageLimitReached] = useState(false);
  const [docName, setDocName] = useState<string>("");
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const token = session?.accessToken;

  const initChat = useCallback(async () => {
    if (!token) return;
    try {
      const [chatRes, docRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/chats`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ documentId }),
        }),
        fetch(`${API_URL}/api/v1/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!chatRes.ok) throw new Error("Failed to initialize chat");
      const { chat } = await chatRes.json();
      setChatId(chat.id);
      setShareToken(chat.shareToken ?? null);

      if (docRes.ok) {
        const { documents } = await docRes.json();
        const doc = documents.find((d: { id: string; name: string }) => d.id === documentId);
        if (doc) setDocName(doc.name);
      }

      const msgRes = await fetch(`${API_URL}/api/v1/chats/${chat.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (msgRes.ok) {
        const { messages: history } = await msgRes.json();
        setMessages(history);
      }

      setState("ready");
    } catch {
      setState("error");
    }
  }, [token, documentId]);

  useEffect(() => {
    if (session?.accessToken) initChat();
  }, [session?.accessToken, initChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  async function handleSend() {
    if (!input.trim() || sending || !chatId || !token) return;

    const userText = input.trim();
    setInput("");
    setSending(true);
    setSendError("");
    setStreamingContent("");

    const tempId = crypto.randomUUID();
    const tempUserMsg: Message = {
      id: tempId,
      chatId,
      role: "user",
      content: userText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch(`${API_URL}/api/v1/chats/${chatId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: userText }),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) throw new Error("Stream request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let suggestions: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;

          try {
            const parsed = JSON.parse(raw);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.token) {
              accumulated += parsed.token;
              setStreamingContent(accumulated);
            }
            if (parsed.suggestions) {
              suggestions = parsed.suggestions;
            }
          } catch {
            // malformed chunk — skip
          }
        }
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        chatId,
        role: "assistant",
        content: accumulated,
        createdAt: new Date().toISOString(),
        suggestions,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string; code?: string };
      if (e.name !== "AbortError") {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        if (e.code === "MESSAGE_LIMIT") {
          setShowUpgradeBanner(true);
          setMessageLimitReached(true);
          setSendError("");
        } else {
          setSendError("Failed to send message. Please try again.");
        }
      }
    } finally {
      setStreamingContent(null);
      setSending(false);
      abortRef.current = null;
    }
  }

  async function handleExport() {
    if (!chatId || !token) return;
    const res = await fetch(`${API_URL}/api/v1/chats/${chatId}/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") ?? "";
    const filenameMatch = disposition.match(/filename="([^"]+)"/);
    const filename = filenameMatch?.[1] ?? "chat-export.md";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    if (!chatId || !token) return;
    setShareLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/chats/${chatId}/share`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const { shareToken: newToken } = await res.json();
      setShareToken(newToken);
      if (newToken) {
        const url = `${window.location.origin}/share/${newToken}`;
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 3000);
      }
    } catch {
      // silently ignore
    } finally {
      setShareLoading(false);
    }
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading session…
      </div>
    );
  }

  const headerContent = (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/")}
          aria-label="Back to documents"
          className="shrink-0 transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {docName || "Document"}
          </p>
          <p className="text-xs text-muted-foreground">Chat with document</p>
        </div>
      </div>
      {messages.length > 0 && (
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant={shareToken ? "default" : "outline"}
            size="sm"
            onClick={handleShare}
            disabled={shareLoading}
            className="gap-1.5 transition-colors duration-200"
            aria-label={shareToken ? "Revoke share link" : "Share chat"}
          >
            {shareCopied ? (
              <>
                <Link className="h-3.5 w-3.5" />
                Copied!
              </>
            ) : shareToken ? (
              <>
                <X className="h-3.5 w-3.5" />
                Unshare
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                Share
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-1.5 transition-colors duration-200"
            aria-label="Export chat as markdown"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <DashboardShell headerContent={headerContent}>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto">
          <MessageList
            messages={messages}
            streamingContent={streamingContent}
            sending={sending}
            state={state}
            onSuggestionClick={(q) => setInput(q)}
            bottomRef={bottomRef}
          />
        </div>

        {sendError && (
          <div className="mx-auto w-full max-w-2xl px-4 pb-2">
            <Alert variant="destructive" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <AlertDescription className="flex-1">{sendError}</AlertDescription>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setSendError("")}
                className="shrink-0 gap-1 text-destructive hover:text-destructive"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Dismiss
              </Button>
            </Alert>
          </div>
        )}

        {showUpgradeBanner && (
          <div className="mx-auto w-full max-w-2xl px-4 pb-2">
            <Alert className="flex items-center gap-2 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="flex-1 text-amber-800 dark:text-amber-200">
                You can only send 3 messages per document on the free plan. Upgrade to Pro for unlimited messages.
              </AlertDescription>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => router.push("/billing")}
                className="shrink-0 gap-1 text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 font-medium"
              >
                Upgrade
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowUpgradeBanner(false)}
                className="shrink-0 gap-1 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
              >
                Dismiss
              </Button>
            </Alert>
          </div>
        )}

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={state !== "ready" || sending || messageLimitReached}
        />
      </div>
    </DashboardShell>
  );
}
