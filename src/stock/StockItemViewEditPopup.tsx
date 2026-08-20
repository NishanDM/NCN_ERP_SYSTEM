import React, { useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"

//==========    DATA ===========================

import {
  formatCurrency,
  isLowStock,
  type StockItemRecord,
  type StockItemStatus,
} from "./StockItemsData"

// ---- Types ------------------------------------------------------------------

type PopupMode = "view" | "edit"

interface StockItemPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: StockItemRecord | null
  mode: PopupMode
  onSwitchToEdit: () => void
  categories: string[]
  subCategoriesByCategory: Record<string, string[]>
  brands: string[]
  suppliers: string[]
  onSubmit: (updated: StockItemRecord) => void
}

type FormState = Omit<StockItemRecord, "id" | "itemCode">
type NumericField = "quantity" | "reorderLevel" | "supplierUnitPrice" | "costPrice" | "sellingPrice"
type FormErrors = Partial<Record<keyof FormState, string>>

const NUMERIC_FIELDS: { field: NumericField; label: string; allowDecimal: boolean }[] = [
  { field: "quantity", label: "Quantity", allowDecimal: false },
  { field: "reorderLevel", label: "Reorder Level", allowDecimal: false },
  { field: "supplierUnitPrice", label: "Supplier Price (Rs.)", allowDecimal: true },
  { field: "costPrice", label: "Cost Price (Rs.)", allowDecimal: true },
  { field: "sellingPrice", label: "Selling Price (Rs.)", allowDecimal: true },
]

function toFormState(item: StockItemRecord): FormState {
  const {  ...rest } = item
  return rest
}

// ---- Small presentational helper (view mode) ---------------------------------

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium break-words">{value}</span>
    </div>
  )
}


function StockItemPopup({
  open,
  onOpenChange,
  item,
  mode,
  onSwitchToEdit,
  categories,
  subCategoriesByCategory,
  brands,
  suppliers,
  onSubmit,
}: StockItemPopupProps) {
  const [form, setForm] = useState<FormState | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})

  const resetKey = item ? `${item.id}:${mode}` : null
  const [prevResetKey, setPrevResetKey] = useState(resetKey)
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey)
    if (item && mode === "edit") {
      setForm(toFormState(item))
      setErrors({})
    }
  }

  if (!item) return null

  // ---- View mode ---------------------------------------------------------

  if (mode === "view") {
    const lowStock = isLowStock(item)

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{item.itemName}</DialogTitle>
            <DialogDescription className="font-mono text-xs">{item.itemCode}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="flex flex-wrap items-center gap-2">
              {item.status === "active" ? (
                <Badge variant="secondary" className="gap-1.5 font-normal">
                  <span className="size-1.5 rounded-full bg-foreground/70" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                  Inactive
                </Badge>
              )}
              {lowStock && (
                <Badge variant="destructive" className="gap-1.5 font-normal">
                  <AlertTriangle className="size-3" />
                  {item.quantity === 0 ? "Out of stock" : "Low stock"}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="Brand" value={item.brand} />
              <DetailRow label="SKU" value={item.stockKeepingUnit} />
              <DetailRow label="Category" value={item.categoryName} />
              <DetailRow label="Sub-Category" value={item.subCategoryName} />
              <DetailRow label="Supplier" value={item.supplierName} />
              <DetailRow
                label="Quantity"
                value={
                  <span className={lowStock ? "text-destructive" : undefined}>
                    {item.quantity} (reorder at {item.reorderLevel})
                  </span>
                }
              />
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Pricing</p>
              <div className="grid grid-cols-3 gap-3">
                <DetailRow label="Supplier Price" value={formatCurrency(item.supplierUnitPrice)} />
                <DetailRow label="Cost Price" value={formatCurrency(item.costPrice)} />
                <DetailRow label="Selling Price" value={formatCurrency(item.sellingPrice)} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="button" onClick={onSwitchToEdit}>
              <Pencil />
              Edit Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // ---- Edit mode -----------------------------------------------------------

  if (!form) return null

  const subCategoryOptions = subCategoriesByCategory[form.categoryName] ?? []

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleCategoryChange = (value: string | null) => {
    if (!value) return
    const nextSubOptions = subCategoriesByCategory[value] ?? []
    setForm((prev) =>
      prev
        ? {
            ...prev,
            categoryName: value,
            // Selecting a new category invalidates whatever sub-category
            // was picked, same rule the page-level filters follow.
            subCategoryName: nextSubOptions[0] ?? "",
          }
        : prev
    )
  }

  const validate = (): boolean => {
    const nextErrors: FormErrors = {}

    if (!form.itemName.trim()) nextErrors.itemName = "Description is required"
    if (!form.brand.trim()) nextErrors.brand = "Brand is required"
    if (!form.stockKeepingUnit.trim()) nextErrors.stockKeepingUnit = "Part number is required"
    if (!form.supplierName.trim()) nextErrors.supplierName = "Supplier is required"
    if (!form.categoryName) nextErrors.categoryName = "Category is required"
    if (!form.subCategoryName) nextErrors.subCategoryName = "Sub-category is required"

    if (!Number.isInteger(form.quantity) || form.quantity < 0) {
      nextErrors.quantity = "Quantity must be a whole number, 0 or more"
    }
    if (!Number.isInteger(form.reorderLevel) || form.reorderLevel < 0) {
      nextErrors.reorderLevel = "Reorder level must be a whole number, 0 or more"
    }
    if (!Number.isFinite(form.supplierUnitPrice) || form.supplierUnitPrice < 0) {
      nextErrors.supplierUnitPrice = "Enter a valid price"
    }
    if (!Number.isFinite(form.costPrice) || form.costPrice < 0) {
      nextErrors.costPrice = "Enter a valid price"
    }
    if (!Number.isFinite(form.sellingPrice) || form.sellingPrice < 0) {
      nextErrors.sellingPrice = "Enter a valid price"
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    if (!validate()) return

    const updated: StockItemRecord = {
      ...form,
      id: item.id,
      itemCode: item.itemCode,
      itemName: form.itemName.trim(),
      brand: form.brand.trim(),
      stockKeepingUnit: form.stockKeepingUnit.trim(),
      supplierName: form.supplierName.trim(),
    }

    onSubmit(updated)
    toast.success("Item updated", {
      description: `"${updated.itemName}" has been saved.`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Stock Item</DialogTitle>
            <DialogDescription>
              Item Code <span className="font-mono">{item.itemCode}</span> — item codes can't be
              changed here.
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[65vh] grid-cols-1 gap-4 overflow-y-auto py-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="edit-item-description">Item Name</FieldLabel>
              <Input
                id="edit-item-description"
                autoFocus
                value={form.itemName}
                onChange={(e) => updateField("itemName", e.target.value)}
              />
              {errors.itemName && (
                <FieldDescription className="text-destructive">
                  {errors.itemName}
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-brand">Brand</FieldLabel>
              <Input
                id="edit-brand"
                list="edit-brand-options"
                value={form.brand}
                onChange={(e) => updateField("brand", e.target.value)}
              />
              <datalist id="edit-brand-options">
                {brands.map((brand) => (
                  <option key={brand} value={brand} />
                ))}
              </datalist>
              {errors.brand && (
                <FieldDescription className="text-destructive">{errors.brand}</FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-part-no">SKU</FieldLabel>
              <Input
                id="edit-part-no"
                value={form.stockKeepingUnit}
                onChange={(e) => updateField("stockKeepingUnit", e.target.value)}
              />
              {errors.stockKeepingUnit && (
                <FieldDescription className="text-destructive">{errors.stockKeepingUnit}</FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-category">Category</FieldLabel>
              <Select value={form.categoryName} onValueChange={handleCategoryChange}>
                <SelectTrigger id="edit-category" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryName && (
                <FieldDescription className="text-destructive">
                  {errors.categoryName}
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-subcategory">Sub-Category</FieldLabel>
              <Select
                value={form.subCategoryName}
                onValueChange={(value) => value && updateField("subCategoryName", value)}
              >
                <SelectTrigger id="edit-subcategory" className="w-full">
                  <SelectValue placeholder="Select sub-category" />
                </SelectTrigger>
                <SelectContent>
                  {subCategoryOptions.map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subCategoryName && (
                <FieldDescription className="text-destructive">
                  {errors.subCategoryName}
                </FieldDescription>
              )}
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="edit-supplier">Supplier</FieldLabel>
              <Input
                id="edit-supplier"
                list="edit-supplier-options"
                value={form.supplierName}
                onChange={(e) => updateField("supplierName", e.target.value)}
              />
              <datalist id="edit-supplier-options">
                {suppliers.map((supplier) => (
                  <option key={supplier} value={supplier} />
                ))}
              </datalist>
              {errors.supplierName && (
                <FieldDescription className="text-destructive">
                  {errors.supplierName}
                </FieldDescription>
              )}
            </Field>

            {NUMERIC_FIELDS.map(({ field, label, allowDecimal }) => (
              <Field key={field}>
                <FieldLabel htmlFor={`edit-${field}`}>{label}</FieldLabel>
                <Input
                  id={`edit-${field}`}
                  type="number"
                  min={0}
                  step={allowDecimal ? "0.01" : 1}
                  value={form[field]}
                  onChange={(e) => updateField(field, Number(e.target.value))}
                />
                {errors[field] && (
                  <FieldDescription className="text-destructive">{errors[field]}</FieldDescription>
                )}
              </Field>
            ))}

            <Field>
              <FieldLabel htmlFor="edit-status">Status</FieldLabel>
              <Select
                value={form.status}
                onValueChange={(value) => value && updateField("status", value as StockItemStatus)}
              >
                <SelectTrigger id="edit-status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default StockItemPopup