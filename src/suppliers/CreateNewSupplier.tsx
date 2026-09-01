import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

//==========    COMPONENTS ===========================

import {
  getNextSupplierCode,
  CREDIT_PERIOD_OPTIONS,
  DEFAULT_CREDIT_PERIOD,
  SUPPLIER_GOODS_CATEGORIES,
  type CreditPeriodDays,
  type SupplierGoodsCategory,
  type SupplierRecord,
} from "./ViewAllSuppliersData"

// ---- Props --------------------------------------------------------------------

export type SupplierPopupMode = "create" | "edit" | "view"

interface CreateNewSupplierProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: SupplierPopupMode
  supplier?: SupplierRecord | null
  /** Used only in "create" mode to auto-fill the next supplier code. */
  existingSuppliers: SupplierRecord[]
  onSubmit: (supplier: SupplierRecord) => void
}

const ACCORDION_SECTIONS = [
  "details",
  "contact",
  "credit",
  "goods",
  "remarks",
] as const

function CreateNewSupplier({
  open,
  onOpenChange,
  mode,
  supplier = null,
  existingSuppliers,
  onSubmit,
}: CreateNewSupplierProps) {
  const nextSupplierCode = useMemo(
    () => getNextSupplierCode(existingSuppliers),
    [existingSuppliers]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <SupplierForm
          key={`${mode}-${supplier?.id ?? "new"}-${open}`}
          mode={mode}
          supplier={supplier}
          nextSupplierCode={nextSupplierCode}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  )
}

// ---- Inner form ---------------------------------------------------------------

interface SupplierFormProps {
  mode: SupplierPopupMode
  supplier: SupplierRecord | null
  nextSupplierCode: string
  onOpenChange: (open: boolean) => void
  onSubmit: (supplier: SupplierRecord) => void
}

function SupplierForm({
  mode,
  supplier,
  nextSupplierCode,
  onOpenChange,
  onSubmit,
}: SupplierFormProps) {
  const isViewMode = mode === "view"
  const isEditMode = mode === "edit"

  const [supplierName, setSupplierName] = useState(supplier?.supplierName ?? "")
  const [address, setAddress] = useState(supplier?.address ?? "")
  const [contactNumber, setContactNumber] = useState(
    supplier?.contactNumber ?? ""
  )
  const [whatsappNumber, setWhatsappNumber] = useState(
    supplier?.whatsappNumber ?? ""
  )
  const [email, setEmail] = useState(supplier?.email ?? "")
  const [creditPeriodDays, setCreditPeriodDays] = useState<CreditPeriodDays>(
    supplier?.creditPeriodDays ?? DEFAULT_CREDIT_PERIOD
  )
  const [creditLimit, setCreditLimit] = useState(supplier?.creditLimit ?? 0)
  const [remarks, setRemarks] = useState(supplier?.remarks ?? "")
  const [goodsCategories, setGoodsCategories] = useState<Set<SupplierGoodsCategory>>(
    () => new Set(supplier?.goodsCategories ?? [])
  )

  const supplierCode = supplier?.supplierCode ?? nextSupplierCode

  const toggleGoodsCategory = (
    value: SupplierGoodsCategory,
    checked: boolean
  ) => {
    setGoodsCategories((prev) => {
      const next = new Set(prev)
      if (checked) next.add(value)
      else next.delete(value)
      return next
    })
  }

  const handleCreditLimitChange = (raw: string) => {
    const value = Number(raw)
    setCreditLimit(Number.isNaN(value) || value < 0 ? 0 : value)
  }

  // ---- Submit -----------------------------------------------------------------

  const handleSubmit = () => {
    if (!supplierName.trim()) {
      toast.error("Supplier name is required", {
        description: "Enter a name so this supplier can be identified.",
      })
      return
    }

    if (!address.trim()) {
      toast.error("Address is required", {
        description: "Enter the supplier's address.",
      })
      return
    }

    if (!whatsappNumber.trim()) {
      toast.error("WhatsApp number is required", {
        description: "Enter a WhatsApp contact number for this supplier.",
      })
      return
    }

    if (!email.trim()) {
      toast.error("Email is required", {
        description: "Enter an email address for this supplier.",
      })
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error("Invalid email address", {
        description: "Check the email and try again.",
      })
      return
    }

    if (!creditLimit || creditLimit <= 0) {
      toast.error("Credit limit is required", {
        description: "Enter a credit limit greater than 0 for this supplier.",
      })
      return
    }

    onSubmit({
      id: supplier?.id ?? crypto.randomUUID(),
      supplierCode,
      supplierName: supplierName.trim(),
      address: address.trim(),
      contactNumber: contactNumber.trim(),
      whatsappNumber: whatsappNumber.trim(),
      email: email.trim(),
      creditPeriodDays,
      creditLimit,
      remarks: remarks.trim(),
      goodsCategories: Array.from(goodsCategories),
    })
    onOpenChange(false)
  }

  const dialogTitle =
    mode === "create"
      ? "Add Supplier"
      : mode === "edit"
        ? "Edit Supplier"
        : "Supplier Details"
  const dialogDescription =
    mode === "create"
      ? "A new supplier code is generated automatically."
      : `Supplier code ${supplierCode}`

  return (
    <>
      <DialogHeader>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogDescription>{dialogDescription}</DialogDescription>
      </DialogHeader>

      <Accordion
        defaultValue={[...ACCORDION_SECTIONS]}
        className="max-h-[65vh] overflow-y-auto"
      >
        {/* ---- Supplier details ----------------------------------------------- */}
        <AccordionItem value="details">
          <AccordionTrigger>Supplier Details</AccordionTrigger>
          <AccordionContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="supplier-code">Supplier Code</FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    id="supplier-code"
                    value={supplierCode}
                    disabled
                    className="font-mono"
                  />
                  {mode === "create" && (
                    <Badge variant="secondary" className="shrink-0 font-normal">
                      Auto-generated
                    </Badge>
                  )}
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="supplier-name">
                  Supplier Name <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="supplier-name"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Mihiri Motors (Pvt) Ltd"
                  disabled={isViewMode}
                />
              </Field>
            </FieldGroup>
          </AccordionContent>
        </AccordionItem>

        {/* ---- Contact information ---------------------------------------------- */}
        <AccordionItem value="contact">
          <AccordionTrigger>Contact Information</AccordionTrigger>
          <AccordionContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="supplier-whatsapp">
                  WhatsApp Number <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="supplier-whatsapp"
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="07XXXXXXXX"
                  disabled={isViewMode}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="supplier-landline">
                  Fixed Line Number
                </FieldLabel>
                <Input
                  id="supplier-landline"
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="0XXXXXXXXX"
                  disabled={isViewMode}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="supplier-email">
                  Email <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="supplier-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="supplier@example.com"
                  disabled={isViewMode}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="supplier-address">
                  Address <span className="text-destructive">*</span>
                </FieldLabel>
                <Textarea
                  id="supplier-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, town, city"
                  disabled={isViewMode}
                  rows={2}
                />
              </Field>
            </FieldGroup>
          </AccordionContent>
        </AccordionItem>

        {/* ---- Credit terms ------------------------------------------------------- */}
        <AccordionItem value="credit">
          <AccordionTrigger>Credit Terms</AccordionTrigger>
          <AccordionContent>
            <FieldGroup className="sm:flex-row sm:*:flex-1">
              <Field>
                <FieldLabel htmlFor="supplier-credit-period">
                  Credit Period <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={String(creditPeriodDays)}
                  onValueChange={(value) =>
                    setCreditPeriodDays(
                      (Number(value) as CreditPeriodDays) ??
                        DEFAULT_CREDIT_PERIOD
                    )
                  }
                  disabled={isViewMode}
                >
                  <SelectTrigger
                    id="supplier-credit-period"
                    className="w-full min-w-0"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CREDIT_PERIOD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="supplier-credit-limit">
                  Credit Limit (Rs.) <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="supplier-credit-limit"
                  type="number"
                  min={0}
                  step="0.01"
                  value={creditLimit}
                  onChange={(e) => handleCreditLimitChange(e.target.value)}
                  disabled={isViewMode}
                />
              </Field>
            </FieldGroup>
          </AccordionContent>
        </AccordionItem>

        {/* ---- Goods categories ------------------------------------------------------ */}
        <AccordionItem value="goods">
          <AccordionTrigger>Supplier Goods</AccordionTrigger>
          <AccordionContent>
            <FieldDescription className="mb-2">
              What this supplier mainly deals in used to route purchase orders
              to the right suppliers later.
            </FieldDescription>
            <div className="flex flex-col gap-2.5">
              {SUPPLIER_GOODS_CATEGORIES.map((category) => (
                <FieldLabel
                  key={category.value}
                  htmlFor={`supplier-goods-${category.value}`}
                >
                  <Field orientation="horizontal">
                    <Checkbox
                      id={`supplier-goods-${category.value}`}
                      checked={goodsCategories.has(category.value)}
                      onCheckedChange={(checked) =>
                        toggleGoodsCategory(category.value, checked === true)
                      }
                      disabled={isViewMode}
                    />
                    <FieldContent>{category.label}</FieldContent>
                  </Field>
                </FieldLabel>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ---- Remarks ------------------------------------------------------------------ */}
        <AccordionItem value="remarks">
          <AccordionTrigger>Remarks</AccordionTrigger>
          <AccordionContent>
            <Field>
              <FieldLabel htmlFor="supplier-remarks">
                Supplier Remarks
              </FieldLabel>
              <Textarea
                id="supplier-remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Notes about reliability, delivery schedule, negotiated terms, etc."
                disabled={isViewMode}
                rows={3}
              />
            </Field>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          {isViewMode ? "Close" : "Cancel"}
        </DialogClose>
        {!isViewMode && (
          <Button type="button" onClick={handleSubmit}>
            {isEditMode ? "Save Changes" : "Add Supplier"}
          </Button>
        )}
      </DialogFooter>
    </>
  )
}

export default CreateNewSupplier