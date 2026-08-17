import React, { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"



//==========    COMPONENTS ===========================

import AddCustomAttributesPopup from "./AddCustomAttributesPopup"

// ---- Types ----------------------------------------------------------------

export interface StockItem {
  itemName: string
  itemDescription: string
  itemCode: string
  stockKeepingUnit: string
  costPrice: number
  sellingPrice: number
  supplierName: string
  isWarrantyAvailable: boolean
  quantity: number
  reorderLevel: number
  itemLog: string
}

type FieldKey = keyof StockItem

type FieldType = "text" | "textarea" | "number" | "checkbox"

// Grouping fields into sections is what makes an 11-field form read as
// "designed" instead of "a long list of inputs."
type FieldCategory =
  | "Basic Information"
  | "Pricing"
  | "Supplier & Warranty"
  | "Stock Amount"
  | "Additional Notes"

interface FieldConfig {
  key: FieldKey
  label: string
  type: FieldType
  required?: boolean
  category: FieldCategory
  description?: string
  placeholder?: string
}

// ---- Field metadata (the 11 mandatory attributes) --------------------------

const FIELD_CONFIG: FieldConfig[] = [
  { key: "itemName", label: "Item Name", type: "text", category: "Basic Information", placeholder: "e.g. Wireless Mouse", required: true },
  { key: "itemDescription", label: "Item Description", type: "textarea", category: "Basic Information", placeholder: "Short description of the item" },
  { key: "itemCode", label: "Item Code", type: "text", category: "Basic Information", placeholder: "e.g. ITM-0001", required: true },
  { key: "stockKeepingUnit", label: "SKU (Stock Keeping Unit)", type: "text", category: "Basic Information", placeholder: "e.g. WM-BLK-01" },
  { key: "costPrice", label: "Cost Price", type: "number", category: "Pricing", placeholder: "0.00" },
  { key: "sellingPrice", label: "Selling Price", type: "number", category: "Pricing", placeholder: "0.00" },
  { key: "supplierName", label: "Supplier Name", type: "text", category: "Supplier & Warranty", placeholder: "e.g. Acme Supplies" },
  { key: "isWarrantyAvailable", label: "Warranty", type: "checkbox", category: "Supplier & Warranty", description: "Check this if the item comes with a warranty" },
  { key: "quantity", label: "Quantity", type: "number", category: "Stock Amount", placeholder: "0" },
  { key: "reorderLevel", label: "Reorder Level(Low Stock Reminder)", type: "number", category: "Stock Amount", placeholder: "0" },
  { key: "itemLog", label: "Item Log", type: "textarea", category: "Additional Notes", placeholder: "Notes, history, or log entries for this item" },
]

const CATEGORY_ORDER: FieldCategory[] = [
  "Basic Information",
  "Pricing",
  "Supplier & Warranty",
  "Stock Amount",
  "Additional Notes",
]

const DEFAULT_VALUES: StockItem = {
  itemName: "",
  itemDescription: "",
  itemCode: "",
  stockKeepingUnit: "",
  costPrice: 0,
  sellingPrice: 0,
  supplierName: "",
  isWarrantyAvailable: false,
  quantity: 0,
  reorderLevel: 0,
  itemLog: "",
}

const DEFAULT_SELECTED_FIELDS: Record<FieldKey, boolean> = {
  itemName: true,
  itemDescription: true,
  itemCode: true,
  stockKeepingUnit: false,
  costPrice: true,
  sellingPrice: true,
  supplierName: true,
  isWarrantyAvailable: false,
  quantity: true,
  reorderLevel: true,
  itemLog: true,
}

// ---- Component --------------------------------------------------------------

interface AddStockItemProps {
  onSubmit?: (item: Partial<StockItem>) => void
  onCancel?: () => void
}

function AddStockItem({ onSubmit, onCancel }: AddStockItemProps) {

  const [openCustomAttributesPopup, setOpenCustomAttributesPopup] = useState();

  const [selectedFields, setSelectedFields] = useState<Record<FieldKey, boolean>>(
    DEFAULT_SELECTED_FIELDS
  )
  const [formData, setFormData] = useState<StockItem>(DEFAULT_VALUES)

  const toggleFieldSelection = (key: FieldKey, checked: boolean) => {
    const field = FIELD_CONFIG.find((f) => f.key === key)
    if (field?.required && !checked) return
    setSelectedFields((prev) => ({ ...prev, [key]: checked }))
  }

  const setAllFields = (checked: boolean) => {
    const next = {} as Record<FieldKey, boolean>
    FIELD_CONFIG.forEach((field) => {
      next[field.key] = field.required ? true : checked
    })
    setSelectedFields(next)
  }

  const updateValue = (key: FieldKey, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const getMissingRequiredFields = (): FieldConfig[] => {
    return FIELD_CONFIG.filter((field) => {
      if (!field.required) return false
      const value = formData[field.key]
      return typeof value === "string" && value.trim() === ""
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const missingFields = getMissingRequiredFields()
    if (missingFields.length > 0) {
      const missingLabels = missingFields.map((field) => field.label).join(", ")
      toast.error("Please fill in the required fields", {
        description: `Missing: ${missingLabels}`,
      })
      return
    }

    // Only include attributes the user selected in the checkbox group
    const item: Partial<StockItem> = {}
    FIELD_CONFIG.forEach((field) => {
      if (selectedFields[field.key]) {
        item[field.key] = formData[field.key] as never
      }
    })

    onSubmit?.(item)
    console.log("New stock item:", item)

    // Frontend-only for now — no API call yet, so we simulate a successful
    // save with a toast and reset the form back to its default state.
    const itemLabel = item.itemName ? `"${item.itemName}"` : "Item"
    toast.success(`${itemLabel} saved successfully`, {
      description: "The stock item has been added to your stock.",
    })

    setFormData(DEFAULT_VALUES)
    setSelectedFields(DEFAULT_SELECTED_FIELDS)
  }

  const selectedCount = Object.values(selectedFields).filter(Boolean).length
  const allSelected = selectedCount === FIELD_CONFIG.length
  const noneSelected = selectedCount === 0

  return (
    <div className="w-full max-w-5xl p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Add New Stock Item</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new item to your stock list. Item Name and Item Code must be
          filled in. Everything else is optional.
        </p>
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {/* --- Attribute selector: horizontal, wrapping chip layout --- */}
            <FieldSet>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FieldLegend variant="label">Item Attributes (What to Add)</FieldLegend>
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
                Tick the details you want to add for this item. You can change your
                selection anytime before saving.
              </FieldDescription>

              <FieldGroup className="flex flex-row flex-wrap gap-2">
                {FIELD_CONFIG.map((field) => {
                  const isChecked = selectedFields[field.key]
                  return (
                    <div
                      key={field.key}
                      title={field.required ? "Always required" : undefined}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors",
                        isChecked
                          ? "border-primary bg-primary/5"
                          : "border-input hover:bg-accent",
                        field.required && "opacity-90"
                      )}
                    >
                      <Checkbox
                        id={`stock-item-select-${field.key}`}
                        name={`stock-item-select-${field.key}`}
                        checked={isChecked}
                        disabled={field.required}
                        onCheckedChange={(checked) =>
                          toggleFieldSelection(field.key, checked === true)
                        }
                      />
                      <FieldLabel
                        htmlFor={`stock-item-select-${field.key}`}
                        className={cn(
                          "text-sm font-normal",
                          field.required ? "cursor-default" : "cursor-pointer"
                        )}
                      >
                        {field.label}
                        {field.required && (
                          <span className="ml-0.5 text-destructive">*</span>
                        )}
                      </FieldLabel>
                    </div>
                  )
                })}
              </FieldGroup>
            </FieldSet>

            <div className="h-px bg-border" />

            <div className="flex justify-left gap-3  border-border mt-2">
              <Button type="button" variant="outline">
                Add Custom Attributes
              </Button>
              <Button >
                Refresh
              </Button>
            </div>

            {/* --- Form fields for selected attributes, grouped by section --- */}
            {noneSelected ? (
              <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nothing is chosen yet. Choose at least one above to start
                filling in details.
              </p>
            ) : (
              <div className="flex flex-col gap-8">
                {CATEGORY_ORDER.map((category) => {
                  const fieldsInCategory = FIELD_CONFIG.filter(
                    (field) => field.category === category && selectedFields[field.key]
                  )
                  if (fieldsInCategory.length === 0) return null

                  return (
                    <FieldSet key={category}>
                      <FieldLegend
                        variant="label"
                        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {category}
                      </FieldLegend>

                      {/* grid-flow-dense lets short fields fill gaps left by
                          full-width fields (textarea/checkbox) instead of
                          leaving empty cells */}
                      <div className="grid grid-flow-row-dense grid-cols-1 gap-4 sm:grid-cols-2">
                        {fieldsInCategory.map((field) => {
                          const spanFull =
                            field.type === "textarea" || field.type === "checkbox"
                          return (
                            <Field
                              key={field.key}
                              className={spanFull ? "sm:col-span-2" : undefined}
                            >
                              {field.type === "checkbox" ? (
                                <Field orientation="horizontal">
                                  <Checkbox
                                    id={`stock-item-value-${field.key}`}
                                    name={`stock-item-value-${field.key}`}
                                    checked={Boolean(formData[field.key])}
                                    onCheckedChange={(checked) =>
                                      updateValue(field.key, checked === true)
                                    }
                                  />
                                  <FieldLabel
                                    htmlFor={`stock-item-value-${field.key}`}
                                    className="font-normal"
                                  >
                                    {field.label}
                                  </FieldLabel>
                                </Field>
                              ) : (
                                <>
                                  <FieldLabel htmlFor={`stock-item-value-${field.key}`}>
                                    {field.label}
                                    {field.required && (
                                      <span className="ml-0.5 text-destructive">*</span>
                                    )}
                                  </FieldLabel>
                                  {field.type === "textarea" ? (
                                    <Textarea
                                      id={`stock-item-value-${field.key}`}
                                      name={`stock-item-value-${field.key}`}
                                      placeholder={field.placeholder}
                                      value={formData[field.key] as string}
                                      onChange={(e) =>
                                        updateValue(field.key, e.target.value)
                                      }
                                    />
                                  ) : (
                                    <Input
                                      id={`stock-item-value-${field.key}`}
                                      name={`stock-item-value-${field.key}`}
                                      type={field.type === "number" ? "number" : "text"}
                                      placeholder={field.placeholder}
                                      value={formData[field.key] as string | number}
                                      onChange={(e) =>
                                        updateValue(
                                          field.key,
                                          field.type === "number"
                                            ? Number(e.target.value)
                                            : e.target.value
                                        )
                                      }
                                    />
                                  )}
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

            <div className="flex justify-end gap-3 border-t border-border pt-6">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={noneSelected}>
                Save Item
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AddStockItem