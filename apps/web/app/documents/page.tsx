"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { FileX, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { UploadZone } from "@/components/pdf/UploadZone";
import { DocumentCard, DocumentCardSkeleton } from "@/components/pdf/DocumentCard";
import { Button } from "@/components/ui/button";

type Document = {
  id: string;
  name: string;
  mimeType: string;
  status: string;
  createdAt: string;
  messageCount?: number;
};

type UploadState = "idle" | "uploading" | "success" | "error";

type DocProgress =
  | { stage: "processing" }
  | { stage: "chunk"; index: number; total: number }
  | { stage: "ready" }
  | { stage: "failed"; error: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState<Record<string, DocProgress>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const esRefs = useRef<Record<string, EventSource>>({});

  const fetchDocuments = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/v1/documents`, {
      headers: { Authorization: `Bearer ${session?.accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      const docs: Document[] = data.documents;
      setDocuments(docs);
      setLoaded(true);
      docs
        .filter((d) => d.status === "processing")
        .forEach((d) => subscribeToProgress(d.id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  useEffect(() => {
    if (session?.accessToken) fetchDocuments();
  }, [session?.accessToken, fetchDocuments]);

  useEffect(() => {
    return () => {
      Object.values(esRefs.current).forEach((es) => es.close());
    };
  }, []);

  function subscribeToProgress(documentId: string) {
    if (esRefs.current[documentId]) return;
    const token = session?.accessToken;
    const es = new EventSource(
      `${API_URL}/api/v1/documents/${documentId}/progress?token=${token}`
    );
    esRefs.current[documentId] = es;

    es.onmessage = (e) => {
      const payload = JSON.parse(e.data) as {
        event: string;
        index?: number;
        total?: number;
        error?: string;
      };
      if (payload.event === "processing") {
        setProgress((p) => ({ ...p, [documentId]: { stage: "processing" } }));
        setDocuments((prev) =>
          prev.map((d) => d.id === documentId ? { ...d, status: "processing" } : d)
        );
      } else if (payload.event === "chunk") {
        setProgress((p) => ({
          ...p,
          [documentId]: { stage: "chunk", index: payload.index!, total: payload.total! },
        }));
      } else if (payload.event === "ready") {
        setProgress((p) => ({ ...p, [documentId]: { stage: "ready" } }));
        setDocuments((prev) =>
          prev.map((d) => d.id === documentId ? { ...d, status: "ready" } : d)
        );
        es.close();
        delete esRefs.current[documentId];
      } else if (payload.event === "failed") {
        setProgress((p) => ({
          ...p,
          [documentId]: { stage: "failed", error: payload.error ?? "Unknown error" },
        }));
        setDocuments((prev) =>
          prev.map((d) => d.id === documentId ? { ...d, status: "failed" } : d)
        );
        es.close();
        delete esRefs.current[documentId];
      }
    };

    es.onerror = () => {
      es.close();
      delete esRefs.current[documentId];
    };
  }

  async function handleFileSelect(file: File) {
    setUploadState("uploading");
    setErrorMsg("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API_URL}/api/v1/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.accessToken}` },
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }
      const { document: doc } = await res.json();
      setDocuments((prev) => [doc, ...prev]);
      setLoaded(true);
      setUploadState("success");
      subscribeToProgress(doc.id);
    } catch (err) {
      setUploadState("error");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function handleRename(id: string, newName: string) {
    const res = await fetch(`${API_URL}/api/v1/documents/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.accessToken}`,
      },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, name: newName } : d))
      );
    }
  }

  async function handleRetry(id: string) {
    const res = await fetch(`${API_URL}/api/v1/documents/${id}/retry`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.accessToken}` },
    });
    if (res.ok) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "pending" } : d))
      );
      setProgress((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
      esRefs.current[id]?.close();
      delete esRefs.current[id];
      subscribeToProgress(id);
    }
  }

  async function handleDelete(id: string) {
    esRefs.current[id]?.close();
    delete esRefs.current[id];
    setProgress((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });
    await fetch(`${API_URL}/api/v1/documents/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session?.accessToken}` },
    });
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading session…
      </div>
    );
  }

  return (
    <DashboardShell headerContent={
      <h1 className="text-lg font-semibold text-foreground">Documents</h1>
    }>
      <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">

        <section aria-labelledby="upload-heading">
          <h2 id="upload-heading" className="mb-1 text-lg font-semibold text-foreground">
            Upload a PDF
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Supported format: PDF, DOCX · max 3 MB
          </p>
          <UploadZone
            uploadState={uploadState}
            errorMsg={errorMsg}
            onFileSelect={handleFileSelect}
            onRetry={() => setUploadState("idle")}
            inputRef={inputRef}
          />
        </section>

        <section aria-labelledby="docs-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="docs-heading" className="text-lg font-semibold text-foreground">
              Your Documents
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDocuments}
              className="gap-1.5 transition-colors duration-200"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {loaded ? "Refresh" : "Load"}
            </Button>
          </div>

          {!loaded && (
            <div className="space-y-2">
              <DocumentCardSkeleton />
              <DocumentCardSkeleton />
              <DocumentCardSkeleton />
            </div>
          )}

          {loaded && documents.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <FileX className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No PDFs yet</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Upload a PDF above to get started
                </p>
              </div>
            </div>
          )}

          {loaded && documents.length > 0 && (
            <div className="space-y-2">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  progress={progress[doc.id]}
                  onChat={() => router.push(`/chat/${doc.id}`)}
                  onDelete={() => handleDelete(doc.id)}
                  onRename={handleRename}
                  onRetry={handleRetry}
                />
              ))}
            </div>
          )}
        </section>
      </div>
      </div>
    </DashboardShell>
  );
}
