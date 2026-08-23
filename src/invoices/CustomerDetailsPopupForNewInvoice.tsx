import { useState } from "react"
import { Search, User, Phone, Mail, Check, XIcon, Building2 } from "lucide-react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Customer } from "@/types/customer"

// Sample mock customer dataset for customer selection
export const MOCK_CUSTOMERS: Customer[] = [
  {
    _id: "cust-001",
    customerCode: "CUST-001",
    name: "Sunil Perera",
    phone: "0771234567",
    email: "sunil.perera@example.com",
    creditLimit: 150000,
    creditDays: 30,
  },
  {
    _id: "cust-002",
    customerCode: "CUST-002",
    name: "Kamal Silva",
    phone: "0719876543",
    email: "kamal.silva@example.com",
    creditLimit: 250000,
    creditDays: 45,
  },
  {
    _id: "cust-003",
    customerCode: "CUST-003",
    name: "Nimal Fernando",
    phone: "0754567890",
    email: "nimal.f@example.com",
    creditLimit: 100000,
    creditDays: 15,
  },
  {
    _id: "cust-004",
    customerCode: "CUST-004",
    name: "Apex Trading Co.",
    phone: "0112345678",
    email: "info@apextrading.lk",
    creditLimit: 500000,
    creditDays: 60,
  },
  {
    _id: "cust-005",
    customerCode: "CUST-005",
    name: "Lanka Retailers Ltd",
    phone: "0117654321",
    email: "contact@lankaretail.lk",
    creditLimit: 300000,
    creditDays: 30,
  },
]

interface CustomerDetailsPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCustomer: Customer | null
  onSelectCustomer: (customer: Customer) => void
}

function CustomerDetailsPopupForNewInvoice({
  open,
  onOpenChange,
  selectedCustomer,
  onSelectCustomer,
}: CustomerDetailsPopupProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Filter customers by name, customer code, phone, or email
  const filteredCustomers = MOCK_CUSTOMERS.filter((c) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      c.name.toLowerCase().includes(q) ||
      c.customerCode.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    )
  })

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop overlay with blur effect */}
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2",
            "max-h-[85vh] gap-4 overflow-hidden rounded-xl bg-popover p-5 text-sm text-popover-foreground",
            "shadow-xl ring-1 ring-foreground/10 outline-none sm:max-w-lg",
            "duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          )}
        >
          {/* Header */}
          <div className="flex flex-col gap-1 pr-6">
            <h2 className="font-heading text-lg font-semibold tracking-tight">Select Customer</h2>
            <p className="text-xs text-muted-foreground">
              Search and pick a customer to attach to this invoice.
            </p>
          </div>

          {/* Close button */}
          <DialogPrimitive.Close
            render={
              <Button variant="ghost" size="icon-sm" className="absolute top-3 right-3" />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Search input field */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by customer name, code, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Customer list container */}
          <div className="max-h-[350px] overflow-y-auto pr-1 space-y-2 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
            {filteredCustomers.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <User className="mx-auto mb-2 size-8 opacity-40" />
                <p>No customers found matching "{searchQuery}"</p>
              </div>
            ) : (
              filteredCustomers.map((customer) => {
                const isSelected = selectedCustomer?._id === customer._id
                return (
                  <div
                    key={customer._id}
                    onClick={() => {
                      onSelectCustomer(customer)
                      onOpenChange(false)
                    }}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/50",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-border/60 bg-card"
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs mt-0.5">
                        {customer.name.startsWith("Apex") || customer.name.startsWith("Lanka") ? (
                          <Building2 className="size-4" />
                        ) : (
                          <User className="size-4" />
                        )}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">
                            {customer.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-mono">
                            {customer.customerCode}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="size-3" />
                            {customer.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="size-3" />
                            {customer.email}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3.5" />
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="-mx-5 -mb-5 flex items-center justify-end gap-2 rounded-b-xl border-t bg-muted/50 p-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export default CustomerDetailsPopupForNewInvoice
