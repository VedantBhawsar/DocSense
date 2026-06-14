"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DocumentRenameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentName: string
  onRename: (newName: string) => void
}

export function DocumentRenameDialog({
  open,
  onOpenChange,
  documentName,
  onRename,
}: DocumentRenameDialogProps) {
  const [draftName, setDraftName] = useState(documentName)

  function handleOpenChange(newOpen: boolean) {
    if (newOpen) {
      setDraftName(documentName)
    }
    onOpenChange(newOpen)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = draftName.trim()
    if (!trimmed || trimmed === documentName) {
      onOpenChange(false)
      return
    }
    onRename(trimmed)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Document</DialogTitle>
          <DialogDescription>
            Enter a new name for your document.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Document name"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Rename</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
