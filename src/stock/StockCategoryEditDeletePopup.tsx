import React, { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// =========================================================================
// Shared types
// =========================================================================

export type StockEntityMode = "category" | "subCategory"

// =========================================================================
// StockCategoryPopup — create / rename a category or sub-category
// =========================================================================

interface StockCategoryPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: StockEntityMode
  editingName?: string
  existingNames: string[]
  onSubmit: (name: string) => void
}

function getNamePopupCopy(mode: StockEntityMode, isEditMode: boolean) {
  const entityLabel = mode === "category" ? "Category" : "Sub Category"

  return {
    title: isEditMode ? `Rename ${entityLabel}` : `New ${entityLabel}`,
    description: isEditMode
      ? `Update the name for this ${entityLabel.toLowerCase()}.`
      : mode === "category"
        ? "Create a top level category to group related stock items under."
        : "Create a sub category to further organize items within this category.",
    fieldLabel: `${entityLabel} Name`,
    placeholder: mode === "category" ? "e.g. Sensors" : "e.g. Temperature Sensors",
    hint:
      mode === "category"
        ? "Shown as the top level folder in the category list."
        : "Shown nested under its parent category.",
    duplicateError: `A ${entityLabel.toLowerCase()} with this name already exists`,
    successTitle: isEditMode ? `${entityLabel} renamed` : `${entityLabel} created`,
    successDescription: (name: string) =>
      isEditMode ? `Renamed to "${name}".` : `"${name}" has been added.`,
    submitLabel: isEditMode ? "Save Changes" : `Create ${entityLabel}`,
  }
}

export function StockCategoryPopup({
  open,
  onOpenChange,
  mode,
  editingName,
  existingNames,
  onSubmit,
}: StockCategoryPopupProps) {
  const isEditMode = Boolean(editingName)
  const copy = getNamePopupCopy(mode, isEditMode)

  const [name, setName] = useState(editingName ?? "")
  const [error, setError] = useState<string | null>(null)

  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setName(editingName ?? "")
      setError(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = name.trim()
    if (!trimmed) {
      setError(`${mode === "category" ? "Category" : "Sub category"} name is required`)
      return
    }

    const isDuplicate = existingNames.some(
      (existing) =>
        existing.toLowerCase() === trimmed.toLowerCase() &&
        existing.toLowerCase() !== (editingName ?? "").toLowerCase()
    )
    if (isDuplicate) {
      setError(copy.duplicateError)
      return
    }

    onSubmit(trimmed)
    toast.success(copy.successTitle, { description: copy.successDescription(trimmed) })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.description}</DialogDescription>
          </DialogHeader>

          <Field className="py-4">
            <FieldLabel htmlFor="entity-name">{copy.fieldLabel}</FieldLabel>
            <Input
              id="entity-name"
              name="entity-name"
              autoFocus
              placeholder={copy.placeholder}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
              }}
            />
            {error ? (
              <FieldDescription className="text-destructive">{error}</FieldDescription>
            ) : (
              <FieldDescription>{copy.hint}</FieldDescription>
            )}
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{copy.submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// =========================================================================
// StockCategoryDeleteDialog — type-to-confirm delete for category / sub-category
// =========================================================================

interface StockCategoryDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /** The exact string the user must type to enable the delete action. */
  matchName: string
  /** Bullet points describing what will be removed, e.g. "3 items". */
  summaryLines: string[]
  onConfirm: () => void
  confirmLabel?: string
}

export function StockCategoryDeleteDialog({
  open,
  onOpenChange,
  title,
  description = "This action is permanent and can't be undone.",
  matchName,
  summaryLines,
  onConfirm,
  confirmLabel = "Delete",
}: StockCategoryDeleteDialogProps) {
  const [confirmText, setConfirmText] = useState("")

  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setConfirmText("")
  }

  const isConfirmed = confirmText.trim() === matchName

  const handleConfirm = () => {
    if (!isConfirmed) return
    onConfirm()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {summaryLines.length > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm">
              <p className="font-medium text-destructive">This will permanently remove:</p>
              <ul className="mt-1.5 space-y-0.5 text-muted-foreground">
                {summaryLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="delete-confirm-input" className="text-sm font-medium">
              Type <span className="font-semibold">"{matchName}"</span> to confirm
            </label>
            <Input
              id="delete-confirm-input"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={matchName}
              aria-invalid={confirmText.length > 0 && !isConfirmed}
              className={
                confirmText.length > 0 && !isConfirmed
                  ? "border-destructive focus-visible:ring-destructive"
                  : undefined
              }
            />
            <p className="text-xs text-muted-foreground">This is case sensitive.</p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!isConfirmed}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
            onClick={handleConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}