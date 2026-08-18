import React, { useState } from "react"
import { toast } from "sonner"
import { PackagePlus, RotateCcw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface CustomAttribute {
  key: string
  label: string
  value: string
}

interface CustomAttributeValues {
  color: string
  length: string
  weight: string
  dimensions: string
  material: string
  unit: string
  pcs: string
  barcode: string
  brand: string
  modelNumber: string
  serialNumber: string
  imeiNumber: string
  batchNumber: string
  country: string
  quality: string
  warrantyMonths: string
  expiryDate: string
  isHazardous: boolean
}

type AttributeKey = keyof CustomAttributeValues

type AttributeType = "text" | "number" | "date" | "select" | "radio" | "checkbox"

type AttributeCategory =
  | "Physical Attributes"
  | "Packaging & Unit"
  | "Identification"
  | "Quality & Compliance"

interface AttributeOption {
  value: string
  label: string
}

interface AttributeConfig {
  key: AttributeKey
  label: string
  type: AttributeType
  category: AttributeCategory
  placeholder?: string
  description?: string
  options?: AttributeOption[]
}

// ---- Field metadata -----------------------------------------------------------

const UNIT_OPTIONS: AttributeOption[] = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "l", label: "Litre (l)" },
  { value: "ml", label: "Millilitre (ml)" },
  { value: "m", label: "Metre (m)" },
  { value: "box", label: "Box" },
  { value: "dozen", label: "Dozen" },
  { value: "pair", label: "Pair" },
  { value: "set", label: "Set" },
]

const QUALITY_OPTIONS: AttributeOption[] = [
  { value: "Grade A", label: "Grade A" },
  { value: "Grade B", label: "Grade B" },
  { value: "Grade C", label: "Grade C" },
]

const FIELD_CONFIG: AttributeConfig[] = [
  // Physical Attributes
  { key: "color", label: "Color", type: "text", category: "Physical Attributes", placeholder: "e.g. Matte Black" },
  { key: "length", label: "Length", type: "text", category: "Physical Attributes", placeholder: "e.g. 15 cm" },
  { key: "weight", label: "Weight", type: "text", category: "Physical Attributes", placeholder: "e.g. 1.2 kg" },
  { key: "dimensions", label: "Dimensions (L x W x H)", type: "text", category: "Physical Attributes", placeholder: "e.g. 30 x 20 x 10 cm" },
  { key: "material", label: "Material", type: "text", category: "Physical Attributes", placeholder: "e.g. Aluminium, Cotton" },

  // Packaging & Unit
  { key: "unit", label: "Unit of Measure", type: "select", category: "Packaging & Unit", options: UNIT_OPTIONS, placeholder: "Select unit of measure" },
  { key: "pcs", label: "Pieces per Pack", type: "number", category: "Packaging & Unit", placeholder: "e.g. 12" },
  { key: "barcode", label: "Barcode", type: "text", category: "Packaging & Unit", placeholder: "e.g. 8901234567890" },

  // Identification
  { key: "brand", label: "Brand", type: "text", category: "Identification", placeholder: "e.g. Samsung" },
  { key: "modelNumber", label: "Model Number", type: "text", category: "Identification", placeholder: "e.g. SM-A155F" },
  { key: "serialNumber", label: "Serial Number", type: "text", category: "Identification", placeholder: "e.g. SN-4472-XZ" },
  { key: "imeiNumber", label: "IMEI Number", type: "text", category: "Identification", placeholder: "15-digit IMEI, for mobile/electronic devices" },
  { key: "batchNumber", label: "Batch / Lot Number", type: "text", category: "Identification", placeholder: "e.g. BATCH-2026-014" },
  { key: "country", label: "Country of Origin", type: "text", category: "Identification", placeholder: "e.g. Sri Lanka" },

  // Quality & Compliance
  { key: "quality", label: "Quality Grade", type: "radio", category: "Quality & Compliance", options: QUALITY_OPTIONS, description: "Grade the item based on its physical condition on arrival" },
  { key: "warrantyMonths", label: "Warranty Period (months)", type: "number", category: "Quality & Compliance", placeholder: "e.g. 12" },
  { key: "expiryDate", label: "Expiry Date", type: "date", category: "Quality & Compliance", description: "For perishable or time-sensitive stock" },
  { key: "isHazardous", label: "Hazardous Material", type: "checkbox", category: "Quality & Compliance", description: "Check this if the item needs hazardous-material handling" },
]

const CATEGORY_ORDER: AttributeCategory[] = [
  "Physical Attributes",
  "Packaging & Unit",
  "Identification",
  "Quality & Compliance",
]

const DEFAULT_VALUES: CustomAttributeValues = {
  color: "",
  length: "",
  weight: "",
  dimensions: "",
  material: "",
  unit: "",
  pcs: "",
  barcode: "",
  brand: "",
  modelNumber: "",
  serialNumber: "",
  imeiNumber: "",
  batchNumber: "",
  country: "",
  quality: "",
  warrantyMonths: "",
  expiryDate: "",
  isHazardous: false,
}

const DEFAULT_SELECTED_FIELDS: Record<AttributeKey, boolean> = {
  color: false,
  length: false,
  weight: false,
  dimensions: false,
  material: false,
  unit: false,
  pcs: false,
  barcode: false,
  brand: false,
  modelNumber: false,
  serialNumber: false,
  imeiNumber: false,
  batchNumber: false,
  country: false,
  quality: false,
  warrantyMonths: false,
  expiryDate: false,
  isHazardous: false,
}

const SCROLLBAR_CLASS = "cattr-scrollbar"
const ScrollbarStyles = () => (
  <style>{`
    .${SCROLLBAR_CLASS} {
      scrollbar-width: thin;
      scrollbar-color: rgba(148, 163, 184, 0.6) transparent;
    }
    .${SCROLLBAR_CLASS}::-webkit-scrollbar {
      width: 8px;
    }
    .${SCROLLBAR_CLASS}::-webkit-scrollbar-track {
      background: transparent;
    }
    .${SCROLLBAR_CLASS}::-webkit-scrollbar-thumb {
      background-color: rgba(148, 163, 184, 0.6);
      border-radius: 9999px;
    }
    .${SCROLLBAR_CLASS}::-webkit-scrollbar-thumb:hover {
      background-color: rgba(148, 163, 184, 0.9);
    }
  `}</style>
)

// ---- Component ------------------------------------------------------------------

interface AddCustomAttributesPopupProps {
  /** Fires with the chosen attributes when the user clicks "Add Attributes". */
  onAddAttributes?: (attributes: CustomAttribute[]) => void
}

function AddCustomAttributesPopup({ onAddAttributes }: AddCustomAttributesPopupProps) {
  const [open, setOpen] = useState(false)
  const [selectedFields, setSelectedFields] = useState<Record<AttributeKey, boolean>>(
    DEFAULT_SELECTED_FIELDS
  )
  const [values, setValues] = useState<CustomAttributeValues>(DEFAULT_VALUES)

  const toggleFieldSelection = (key: AttributeKey, checked: boolean) => {
    setSelectedFields((prev) => ({ ...prev, [key]: checked }))
  }

  const setAllFields = (checked: boolean) => {
    const next = {} as Record<AttributeKey, boolean>
    FIELD_CONFIG.forEach((field) => {
      next[field.key] = checked
    })
    setSelectedFields(next)
  }

  const updateValue = (key: AttributeKey, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  // Small helper so we don't scatter `as string` casts through the JSX —
  // every field except isHazardous is string-backed, so this is a safe,
  // single place to encode that assumption.
  const getStringValue = (key: AttributeKey): string => {
    const value = values[key]
    return typeof value === "string" ? value : ""
  }

  const resetForm = () => {
    setSelectedFields(DEFAULT_SELECTED_FIELDS)
    setValues(DEFAULT_VALUES)
  }

  // A selected attribute is expected to have a value — ticking "IMEI Number"
  // and leaving it blank is almost certainly a mistake, so we validate it
  // the same way AddStockItem validates its own required fields.
  const getMissingSelectedFields = (): AttributeConfig[] => {
    return FIELD_CONFIG.filter((field) => {
      if (!selectedFields[field.key] || field.type === "checkbox") return false
      return getStringValue(field.key).trim() === ""
    })
  }

  const selectedCount = Object.values(selectedFields).filter(Boolean).length
  const allSelected = selectedCount === FIELD_CONFIG.length
  const noneSelected = selectedCount === 0

  const handleAddAttributes = (e: React.FormEvent) => {
    e.preventDefault()

    if (noneSelected) {
      toast.error("Select at least one attribute to add")
      return
    }

    const missingFields = getMissingSelectedFields()
    if (missingFields.length > 0) {
      const missingLabels = missingFields.map((field) => field.label).join(", ")
      toast.error("Please fill in the selected attributes", {
        description: `Missing: ${missingLabels}`,
      })
      return
    }

    const attributes: CustomAttribute[] = FIELD_CONFIG.filter(
      (field) => selectedFields[field.key]
    ).map((field) => ({
      key: field.key,
      label: field.label,
      value:
        field.type === "checkbox"
          ? values[field.key]
            ? "Yes"
            : "No"
          : getStringValue(field.key),
    }))

    onAddAttributes?.(attributes)
    console.log("Custom attributes added:", attributes)

    toast.success(
      `${attributes.length} custom attribute${attributes.length > 1 ? "s" : ""} added`,
      { description: "These will be attached to this stock item." }
    )

    resetForm()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline">
            <PackagePlus />
            Add Custom Attributes
          </Button>
        }
      />

      <DialogContent className="flex max-h-[90vh] w-full min-h-0 flex-col overflow-hidden sm:max-w-2xl lg:max-w-3xl">
        <ScrollbarStyles />
        {/* --- Fixed header: never scrolls --- */}
        <DialogHeader>
          <DialogTitle>Add Custom Attributes</DialogTitle>
          <DialogDescription>
            Choose the extra details that apply to this item, then fill them in.
            For example, add an IMEI number for electronics or a Material
            type for clothing. just pick what makes sense for this item.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleAddAttributes}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
        >
          
          <FieldSet className="shrink-0 border-b border-border pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FieldLegend variant="label">Available Attributes</FieldLegend>
                <Badge variant="secondary" className="font-normal">
                  {selectedCount} of {FIELD_CONFIG.length} selected
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  disabled={allSelected}
                  onClick={() => setAllFields(true)}
                >
                  Select all
                </Button>
                <span className="text-xs text-muted-foreground">/</span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  disabled={noneSelected}
                  onClick={() => setAllFields(false)}
                >
                  Clear all
                </Button>
              </div>
            </div>
            <FieldDescription>
              Tick anything relevant to this item. You can leave all of them unchecked if you prefer.
            </FieldDescription>

            <div
              className={cn(
                "max-h-40 w-full overflow-y-auto rounded-md border border-border/60 bg-muted/20 p-2",
                SCROLLBAR_CLASS
              )}
            >
              <FieldGroup className="flex flex-row flex-wrap gap-2">
                {FIELD_CONFIG.map((field) => {
                  const isChecked = selectedFields[field.key]
                  return (
                    <div
                      key={field.key}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors",
                        isChecked
                          ? "border-primary bg-primary/5"
                          : "border-input hover:bg-accent"
                      )}
                    >
                      <Checkbox
                        id={`custom-attr-select-${field.key}`}
                        name={`custom-attr-select-${field.key}`}
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          toggleFieldSelection(field.key, checked === true)
                        }
                      />
                      <FieldLabel
                        htmlFor={`custom-attr-select-${field.key}`}
                        className="cursor-pointer text-sm font-normal"
                      >
                        {field.label}
                      </FieldLabel>
                    </div>
                  )
                })}
              </FieldGroup>
            </div>
          </FieldSet>


          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto rounded-md border border-border/60 p-3",
              SCROLLBAR_CLASS
            )}
          >
            <div className="flex flex-col gap-6 pb-1">
              {noneSelected ? (
                <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nothing is chosen yet. Choose at least one from the list above to
                  start entering its details.
                </p>
              ) : (
                <div className="flex flex-col gap-6">
                  {CATEGORY_ORDER.map((category) => {
                    const fieldsInCategory = FIELD_CONFIG.filter(
                      (field) =>
                        field.category === category && selectedFields[field.key]
                    )
                    if (fieldsInCategory.length === 0) return null

                    return (
                      <FieldSet key={category}>
                        <FieldLegend
                          variant="label"
                          className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                        >
                          {category}
                        </FieldLegend>

                        <div className="grid grid-flow-row-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {fieldsInCategory.map((field) => {
                            const spanFull =
                              field.type === "radio" || field.type === "checkbox"
                            return (
                              <Field
                                key={field.key}
                                className={spanFull ? "sm:col-span-2 lg:col-span-3" : undefined}
                              >
                                {field.type === "checkbox" && (
                                  <Field orientation="horizontal">
                                    <Checkbox
                                      id={`custom-attr-value-${field.key}`}
                                      name={`custom-attr-value-${field.key}`}
                                      checked={Boolean(values[field.key])}
                                      onCheckedChange={(checked) =>
                                        updateValue(field.key, checked === true)
                                      }
                                    />
                                    <FieldLabel
                                      htmlFor={`custom-attr-value-${field.key}`}
                                      className="font-normal"
                                    >
                                      {field.label}
                                    </FieldLabel>
                                  </Field>
                                )}

                                {field.type === "radio" && (
                                  <>
                                    <FieldLabel>{field.label}</FieldLabel>
                                    <RadioGroup
                                      name={field.key}
                                      value={getStringValue(field.key)}
                                      onValueChange={(value) =>
                                        updateValue(field.key, value as string)
                                      }
                                      className="flex flex-row flex-wrap gap-4"
                                    >
                                      {field.options?.map((option) => (
                                        <Field
                                          key={option.value}
                                          orientation="horizontal"
                                          className="w-fit"
                                        >
                                          <RadioGroupItem
                                            value={option.value}
                                            id={`custom-attr-value-${field.key}-${option.value}`}
                                          />
                                          <FieldLabel
                                            htmlFor={`custom-attr-value-${field.key}-${option.value}`}
                                            className="font-normal"
                                          >
                                            {option.label}
                                          </FieldLabel>
                                        </Field>
                                      ))}
                                    </RadioGroup>
                                  </>
                                )}

                                {field.type === "select" && (
                                  <>
                                    <FieldLabel htmlFor={`custom-attr-value-${field.key}`}>
                                      {field.label}
                                    </FieldLabel>
                                    <Select
                                      value={getStringValue(field.key) || undefined}
                                      onValueChange={(value) =>
                                        updateValue(field.key, value as string)
                                      }
                                    >
                                      <SelectTrigger
                                        id={`custom-attr-value-${field.key}`}
                                        className="w-full"
                                      >
                                        <SelectValue placeholder={field.placeholder} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {field.options?.map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </>
                                )}

                                {(field.type === "text" ||
                                  field.type === "number" ||
                                  field.type === "date") && (
                                  <>
                                    <FieldLabel htmlFor={`custom-attr-value-${field.key}`}>
                                      {field.label}
                                    </FieldLabel>
                                    <Input
                                      id={`custom-attr-value-${field.key}`}
                                      name={`custom-attr-value-${field.key}`}
                                      type={field.type}
                                      placeholder={field.placeholder}
                                      value={getStringValue(field.key)}
                                      onChange={(e) =>
                                        updateValue(field.key, e.target.value)
                                      }
                                    />
                                  </>
                                )}

                                {field.description && (
                                  <FieldDescription>{field.description}</FieldDescription>
                                )}
                              </Field>
                            )
                          })}
                        </div>
                      </FieldSet>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* --- Fixed footer: never scrolls --- */}

          <DialogFooter className="shrink-0">
            <Button
              type="button"
              variant="ghost"
              className="sm:mr-auto"
              onClick={resetForm}
            >
              <RotateCcw />
              Refresh
            </Button>
            <DialogClose
              render={
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              }
            />
            <Button type="submit" disabled={noneSelected}>
              Add Attributes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddCustomAttributesPopup