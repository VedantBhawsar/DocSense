"use client"

import { useRef, useState, type DragEvent } from "react"
import { UploadCloud, CheckCircle2, XCircle } from "lucide-react"
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
    <div className="space-y-4 animate-fade-in-up">
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
          "group relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-8 py-16 cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 overflow-hidden",
          dragging
            ? "scale-[1.02]"
            : "hover:bg-muted/30",
          isUploading && "pointer-events-none opacity-70"
        )}
        style={{ 
          borderColor: dragging ? 'var(--primary)' : 'var(--border)',
          backgroundColor: dragging ? 'var(--primary)' + '08' : 'transparent'
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleChange}
        />

        {isUploading ? (
          <div className="relative flex flex-col items-center animate-scale-in z-10">
            <div className="relative size-16 mb-4 flex items-center justify-center">
              <svg className="absolute inset-0 size-full animate-spin" viewBox="0 0 100 100" style={{ color: 'var(--border)' }}>
                <circle cx="50" cy="50" r="46" fill="none" strokeWidth="4" />
              </svg>
              <UploadCloud className="size-6" style={{ color: 'var(--primary)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Uploading document…</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Please wait a moment</p>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center">
            <div 
              className={cn(
                "flex size-16 items-center justify-center rounded-2xl transition-transform duration-300 mb-5",
                dragging && "scale-110"
              )}
              style={{ backgroundColor: 'var(--primary)', opacity: 0.1 }}
            >
              <UploadCloud className="size-8" style={{ color: 'var(--primary)' }} />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                {dragging ? "Drop to upload" : "Click or drag document here"}
              </p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>PDFs up to 50 MB</p>
            </div>
          </div>
        )}
      </div>

      {uploadState === "success" && (
        <div 
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm animate-fade-in-up"
          style={{ 
            border: '1px solid oklch(0.5 0.15 145)',
            backgroundColor: 'oklch(0.5 0.15 145)' + '15',
            color: 'oklch(0.5 0.15 145)'
          }}
        >
          <CheckCircle2 className="size-5 shrink-0" />
          <span className="font-medium">File uploaded successfully. Processing started.</span>
        </div>
      )}

      {uploadState === "error" && (
        <div 
          className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 animate-fade-in-up"
          style={{ 
            border: '1px solid var(--destructive)',
            backgroundColor: 'var(--destructive)' + '10',
            color: 'var(--destructive)'
          }}
        >
          <div className="flex items-center gap-3 text-sm">
            <XCircle className="size-5 shrink-0" />
            <span className="font-medium">{errorMsg ?? "Upload failed"}</span>
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="h-8" style={{ borderColor: 'var(--destructive)' }}>
              Try again
            </Button>
          )}
        </div>
      )}
    </div>
  )
}