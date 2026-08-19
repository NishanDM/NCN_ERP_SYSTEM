import React, { useState } from "react"
import { toast } from "sonner"
import { PackagePlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ---- Types (mirrors AttributeDefinition from the stock-management design) --

export type CustomAttributeDataType = "text" | "number" | "boolean" | "date" | "select"

export interface CustomAttributeDefinition {
  id: string
  key: string // machine-safe, derived from label
  label: string
  dataType: CustomAttributeDataType
  options?: string[] // only when dataType === "select"
  unit?: string
  isRequired: boolean
  helpText?: string
}

const DATA_TYPE_OPTIONS: { value: CustomAttributeDataType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Yes / No" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown List" },
]

interface AttributeFormState {
  label: string
  dataType: CustomAttributeDataType
  optionsText: string // comma-separated, used only when dataType === "select"
  unit: string
  isRequired: boolean
  helpText: string
}

const DEFAULT_FORM_STATE: AttributeFormState = {
  label: "",
  dataType: "text",
  optionsText: "",
  unit: "",
  isRequired: false,
  helpText: "",
}

// ---- Helpers ---------------------------------------------------------------

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function generateUniqueKey(label: string, existingKeys: string[]): string {
  const base = slugify(label) || "attribute"
  if (!existingKeys.includes(base)) return base
  let i = 2
  while (existingKeys.includes(`${base}_${i}`)) i++
  return `${base}_${i}`
}

// ---- Component --------------------------------------------------------------

interface AddCustomAttributesPopupProps {
  /** Keys already used by built-in + previously created attributes (dedupe guard). */
  existingKeys?: string[]
  /** Labels already used by built-in + previously created attributes (dedupe guard). */
  existingLabels?: string[]
  /** Fires with the new attribute definition when the user clicks "Create". */
  onCreateAttribute?: (definition: CustomAttributeDefinition) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

function AddCustomAttributesPopup({
  existingKeys = [],
  existingLabels = [],
  onCreateAttribute,
  open: openProp,
  onOpenChange,
  hideTrigger,
}: AddCustomAttributesPopupProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen
  const setOpen = (next: boolean) => {
    if (onOpenChange) onOpenChange(next)
    if (!isControlled) setInternalOpen(next)
  }

  const [form, setForm] = useState<AttributeFormState>(DEFAULT_FORM_STATE)

  const update = <K extends keyof AttributeFormState>(key: K, value: AttributeFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const resetForm = () => setForm(DEFAULT_FORM_STATE)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()

    const label = form.label.trim()
    if (!label) {
      toast.error("Give the attribute a name")
      return
    }

    const isDuplicate = existingLabels.some(
      (existing) => existing.toLowerCase() === label.toLowerCase()
    )
    if (isDuplicate) {
      toast.error("That attribute already exists", {
        description: `"${label}" is already one of this item's attributes.`,
      })
      return
    }

    let options: string[] | undefined
    if (form.dataType === "select") {
      options = Array.from(
        new Set(
          form.optionsText
            .split(",")
            .map((opt) => opt.trim())
            .filter(Boolean)
        )
      )
      if (options.length < 2) {
        toast.error("Add at least two options", {
          description: "Separate each option with a comma, e.g. Red, Blue, Black",
        })
        return
      }
    }

    const definition: CustomAttributeDefinition = {
      id: crypto.randomUUID(),
      key: generateUniqueKey(label, existingKeys),
      label,
      dataType: form.dataType,
      options,
      unit: form.unit.trim() || undefined,
      isRequired: form.isRequired,
      helpText: form.helpText.trim() || undefined,
    }

    onCreateAttribute?.(definition)
    toast.success(`"${label}" attribute created`, {
      description: "It's now available to fill in on this item.",
    })

    resetForm()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger
          render={
            <Button type="button" variant="outline">
              <PackagePlus />
              Add Custom Attribute
            </Button>
          }
        />
      )}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a Custom Attribute</DialogTitle>
          <DialogDescription>
            Define a new attribute for this item — e.g. IMEI Number, RAM, or
            Storage Capacity for a phone. Once created, it'll show up as a
            field on the item form where you can fill in its value.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="attr-label">
                Attribute Name<span className="ml-0.5 text-destructive">*</span>
              </FieldLabel>
              <Input
                id="attr-label"
                placeholder="e.g. IMEI Number"
                value={form.label}
                onChange={(e) => update("label", e.target.value)}
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="attr-data-type">Data Type</FieldLabel>
              <Select
                value={form.dataType}
                onValueChange={(value) => update("dataType", value as CustomAttributeDataType)}
              >
                <SelectTrigger id="attr-data-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATA_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Controls what kind of input shows up on the item form.
              </FieldDescription>
            </Field>

            {form.dataType === "select" && (
              <Field>
                <FieldLabel htmlFor="attr-options">
                  Options<span className="ml-0.5 text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="attr-options"
                  placeholder="e.g. 64GB, 128GB, 256GB"
                  value={form.optionsText}
                  onChange={(e) => update("optionsText", e.target.value)}
                />
                <FieldDescription>Separate each option with a comma.</FieldDescription>
              </Field>
            )}

            {(form.dataType === "number" || form.dataType === "text") && (
              <Field>
                <FieldLabel htmlFor="attr-unit">Unit (optional)</FieldLabel>
                <Input
                  id="attr-unit"
                  placeholder="e.g. GB, cm, kg"
                  value={form.unit}
                  onChange={(e) => update("unit", e.target.value)}
                />
              </Field>
            )}

            <Field orientation="horizontal">
              <Checkbox
                id="attr-required"
                checked={form.isRequired}
                onCheckedChange={(checked) => update("isRequired", checked === true)}
              />
              <FieldLabel htmlFor="attr-required" className="font-normal">
                Required for this item
              </FieldLabel>
            </Field>

            <Field>
              <FieldLabel htmlFor="attr-help">Help Text (optional)</FieldLabel>
              <Textarea
                id="attr-help"
                placeholder="Shown under the field as a hint"
                value={form.helpText}
                onChange={(e) => update("helpText", e.target.value)}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              }
            />
            <Button type="submit">Create Attribute</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddCustomAttributesPopup