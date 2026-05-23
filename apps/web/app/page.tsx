"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef } from "react";

type Document = {
  id: string;
  name: string;
  mimeType: string;
  status: string;
  createdAt: string;
};

type UploadState = "idle" | "uploading" | "success" | "error";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function Home() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function fetchDocuments() {
    const res = await fetch(`${API_URL}/api/v1/documents`, {
      headers: { Authorization: `Bearer ${session?.accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setDocuments(data.documents);
      setLoaded(true);
    }
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

      setUploadState("success");
      fetchDocuments();
    } catch (err) {
      setUploadState("error");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
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
      {/* Header */}
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
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Upload Document</h1>
        <p className="text-sm text-gray-500 mb-6">
          Supported formats: PDF, DOCX — max 50 MB
        </p>

        {/* Drop zone */}
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
              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-sm text-gray-600">Click to select a file</span>
            </>
          )}
        </label>

        {uploadState === "success" && (
          <p className="text-sm text-green-600 mb-4">File uploaded successfully.</p>
        )}
        {uploadState === "error" && (
          <p className="text-sm text-red-600 mb-4">{errorMsg}</p>
        )}

        {/* Document list */}
        <div className="flex items-center justify-between mb-3 mt-6">
          <h2 className="text-base font-semibold text-gray-800">Your Documents</h2>
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
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {doc.mimeType === "application/pdf" ? "PDF" : "DOCX"} &middot;{" "}
                  {doc.status} &middot;{" "}
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
          ))}
        </div>
      </main>
    </div>
  );
}
