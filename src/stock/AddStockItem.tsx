import React, { useState } from "react"
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

interface FieldConfig {
  key: FieldKey
  label: string
  type: FieldType
  description?: string
  placeholder?: string
}

// ---- Field metadata (the 11 attributes) ------------------------------------

const FIELD_CONFIG: FieldConfig[] = [
  { key: "itemName", label: "Item Name", type: "text", placeholder: "e.g. Wireless Mouse" },
  { key: "itemDescription", label: "Item Description", type: "textarea", placeholder: "Short description of the item" },
  { key: "itemCode", label: "Item Code", type: "text", placeholder: "e.g. ITM-0001" },
  { key: "stockKeepingUnit", label: "SKU (Stock Keeping Unit)", type: "text", placeholder: "e.g. WM-BLK-01" },
  { key: "costPrice", label: "Cost Price", type: "number", placeholder: "0.00" },
  { key: "sellingPrice", label: "Selling Price", type: "number", placeholder: "0.00" },
  { key: "supplierName", label: "Supplier Name", type: "text", placeholder: "e.g. Acme Supplies" },
  { key: "isWarrantyAvailable", label: "Warranty Available", type: "checkbox", description: "Check if this item comes with a warranty" },
  { key: "quantity", label: "Quantity", type: "number", placeholder: "0" },
  { key: "reorderLevel", label: "Reorder Level", type: "number", placeholder: "0" },
  { key: "itemLog", label: "Item Log", type: "textarea", placeholder: "Notes, history, or log entries for this item" },
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

const ALL_SELECTED: Record<FieldKey, boolean> = FIELD_CONFIG.reduce(
  (acc, field) => ({ ...acc, [field.key]: true }),
  {} as Record<FieldKey, boolean>
)

// ---- Component --------------------------------------------------------------

interface AddStockItemProps {
  onSubmit?: (item: Partial<StockItem>) => void
}

function AddStockItem({ onSubmit }: AddStockItemProps) {
  const [selectedFields, setSelectedFields] = useState<Record<FieldKey, boolean>>(ALL_SELECTED)
  const [formData, setFormData] = useState<StockItem>(DEFAULT_VALUES)

  const toggleFieldSelection = (key: FieldKey, checked: boolean) => {
    setSelectedFields((prev) => ({ ...prev, [key]: checked }))
  }

  const updateValue = (key: FieldKey, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Only include attributes the user selected in the checkbox group
    const item: Partial<StockItem> = {}
    FIELD_CONFIG.forEach((field) => {
      if (selectedFields[field.key]) {
        item[field.key] = formData[field.key] as never
      }
    })

    onSubmit?.(item)
    console.log("New stock item:", item)
  }

  const selectedCount = Object.values(selectedFields).filter(Boolean).length

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Add a New Stock Item</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* --- Attribute selector --- */}
        <FieldSet>
          <FieldLegend variant="label">Item Attributes</FieldLegend>
          <FieldDescription>
            Select which attributes to include for this item ({selectedCount} of{" "}
            {FIELD_CONFIG.length} selected).
          </FieldDescription>
          <FieldGroup className="gap-3">
            {FIELD_CONFIG.map((field) => (
              <Field orientation="horizontal" key={field.key}>
                <Checkbox
                  id={`stock-item-select-${field.key}`}
                  name={`stock-item-select-${field.key}`}
                  checked={selectedFields[field.key]}
                  onCheckedChange={(checked) =>
                    toggleFieldSelection(field.key, checked === true)
                  }
                />
                <FieldLabel
                  htmlFor={`stock-item-select-${field.key}`}
                  className="font-normal"
                >
                  {field.label}
                </FieldLabel>
              </Field>
            ))}
          </FieldGroup>
        </FieldSet>

        {/* --- Form fields for selected attributes only --- */}
        <FieldSet>
          <FieldLegend variant="label">Item Details</FieldLegend>
          <FieldDescription>
            Fill in values for the attributes you selected above.
          </FieldDescription>
          <FieldGroup className="gap-4">
            {FIELD_CONFIG.filter((field) => selectedFields[field.key]).map((field) => (
              <Field key={field.key}>
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
                    </FieldLabel>
                    {field.type === "textarea" ? (
                      <Textarea
                        id={`stock-item-value-${field.key}`}
                        name={`stock-item-value-${field.key}`}
                        placeholder={field.placeholder}
                        value={formData[field.key] as string}
                        onChange={(e) => updateValue(field.key, e.target.value)}
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
            ))}
          </FieldGroup>
        </FieldSet>

        <Button type="submit" className="self-start">
          Save Item
        </Button>
      </form>
    </div>
  )
}

export default AddStockItem