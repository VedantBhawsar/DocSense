"use client"

import { useRef, useState, type DragEvent } from "react"
import { UploadCloud, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type UploadState = "idle" | "uploading" | "success" | "error"

interface UploadZoneProps {
  uploadState: UploadState
  errorMsg?: string
  onFileSelect: (file: File) => void
  onRetry?: () => void
  inputRef?: React.RefObject<HTMLInputElement | null>
}

export function UploadZone({
  uploadState,
  errorMsg,
  onFileSelect,
  onRetry,
  inputRef: externalRef,
}: UploadZoneProps) {
  const internalRef = useRef<HTMLInputElement>(null)
  const inputRef = externalRef ?? internalRef
  const [dragging, setDragging] = useState(false)

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFileSelect(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
    if (inputRef.current) inputRef.current.value = ""
  }

  const isUploading = uploadState === "uploading"

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload PDF — click or drop file here"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !isUploading && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dragging
            ? "border-primary bg-accent/50"
            : "border-border hover:border-primary/50 hover:bg-accent/30",
          isUploading && "pointer-events-none opacity-70"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleChange}
        />

        {isUploading ? (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading…</p>
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
              <UploadCloud className="h-7 w-7 text-accent-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Drop your PDF here</p>
              <p className="text-xs text-muted-foreground mt-0.5">or click to browse · max 50 MB</p>
            </div>
          </>
        )}
      </div>

      {uploadState === "success" && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          File uploaded — processing started.
        </div>
      )}

      {uploadState === "error" && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <XCircle className="h-4 w-4 shrink-0" />
            {errorMsg ?? "Upload failed"}
          </div>
          {onRetry && (
            <Button variant="outline" size="xs" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
