"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect, useCallback } from "react";

type Document = {
  id: string;
  name: string;
  mimeType: string;
  status: string;
  createdAt: string;
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
      setDocuments(data.documents);
      setLoaded(true);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (session?.accessToken) fetchDocuments();
  }, [session?.accessToken, fetchDocuments]);

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
          prev.map((d) =>
            d.id === documentId ? { ...d, status: "processing" } : d
          )
        );
      } else if (payload.event === "chunk") {
        setProgress((p) => ({
          ...p,
          [documentId]: {
            stage: "chunk",
            index: payload.index!,
            total: payload.total!,
          },
        }));
      } else if (payload.event === "ready") {
        setProgress((p) => ({ ...p, [documentId]: { stage: "ready" } }));
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === documentId ? { ...d, status: "ready" } : d
          )
        );
        es.close();
        delete esRefs.current[documentId];
      } else if (payload.event === "failed") {
        setProgress((p) => ({
          ...p,
          [documentId]: {
            stage: "failed",
            error: payload.error ?? "Unknown error",
          },
        }));
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === documentId ? { ...d, status: "failed" } : d
          )
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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

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
    } finally {
      if (inputRef.current) inputRef.current.value = "";
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
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900">DocSense</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{session.user?.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Upload Document
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Supported formats: PDF, DOCX — max 50 MB
        </p>

        <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-xl bg-white cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors mb-3">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleUpload}
            className="hidden"
          />
          {uploadState === "uploading" ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mb-2" />
              <span className="text-sm text-gray-500">Uploading…</span>
            </>
          ) : (
            <>
              <svg
                className="w-8 h-8 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <span className="text-sm text-gray-600">
                Click to select a file
              </span>
            </>
          )}
        </label>

        {uploadState === "success" && (
          <p className="text-sm text-green-600 mb-4">
            File uploaded — processing started.
          </p>
        )}
        {uploadState === "error" && (
          <p className="text-sm text-red-600 mb-4">{errorMsg}</p>
        )}

        <div className="flex items-center justify-between mb-3 mt-6">
          <h2 className="text-base font-semibold text-gray-800">
            Your Documents
          </h2>
          <button
            onClick={fetchDocuments}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            {loaded ? "Refresh" : "Load"}
          </button>
        </div>

        {loaded && documents.length === 0 && (
          <p className="text-sm text-gray-400">No documents yet.</p>
        )}

        <div className="space-y-2">
          {documents.map((doc) => {
            const p = progress[doc.id];
            const isChunking = p?.stage === "chunk";
            const pct = isChunking
              ? Math.round((p.index / p.total) * 100)
              : null;

            return (
              <div
                key={doc.id}
                className="px-4 py-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {doc.mimeType === "application/pdf" ? "PDF" : "DOCX"}{" "}
                      &middot;{" "}
                      <StatusBadge status={doc.status} progress={p} />{" "}
                      &middot;{" "}
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-xs px-2.5 py-1 border border-red-200 rounded-md bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>

                {p?.stage === "processing" && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Starting…
                  </div>
                )}

                {isChunking && pct !== null && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Embedding chunks…</span>
                      <span>
                        {p.index}/{p.total}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}

                {p?.stage === "failed" && (
                  <p className="mt-1.5 text-xs text-red-500">{p.error}</p>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function StatusBadge({
  status,
  progress,
}: {
  status: string;
  progress: DocProgress | undefined;
}) {
  if (progress?.stage === "chunk") {
    return (
      <span className="text-blue-500">
        processing ({Math.round((progress.index / progress.total) * 100)}%)
      </span>
    );
  }
  if (status === "ready") return <span className="text-green-600">ready</span>;
  if (status === "failed") return <span className="text-red-500">failed</span>;
  if (status === "processing")
    return <span className="text-yellow-600">processing</span>;
  return <span>{status}</span>;
}
