import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Building2,
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

//==========    COMPONENTS ===========================

import CreateNewSupplier, { type SupplierPopupMode } from "./CreateNewSupplier"
import {
  getCreditPeriodLabel,
  INITIAL_SUPPLIERS,
  type SupplierRecord,
} from "./ViewAllSuppliersData"
import { getPaginationRange } from "@/lib/pagination"


const PAGE_SIZE = 5

function ViewAllSuppliers() {
  const [suppliers, setSuppliers] =
    useState<SupplierRecord[]>(INITIAL_SUPPLIERS)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // ---- Add / Edit / View popup ---------------------------------------------------

  const [supplierPopup, setSupplierPopup] = useState<{
    mode: SupplierPopupMode
    supplier: SupplierRecord | null
  } | null>(null)

  const openAddSupplier = () =>
    setSupplierPopup({ mode: "create", supplier: null })
  const openViewSupplier = (supplier: SupplierRecord) =>
    setSupplierPopup({ mode: "view", supplier })
  const openEditSupplier = (supplier: SupplierRecord) =>
    setSupplierPopup({ mode: "edit", supplier })
  const closeSupplierPopup = () => setSupplierPopup(null)

  const handleSupplierSubmit = (supplier: SupplierRecord) => {
    setSuppliers((prev) => {
      const exists = prev.some((item) => item.id === supplier.id)
      return exists
        ? prev.map((item) => (item.id === supplier.id ? supplier : item))
        : [supplier, ...prev]
    })
    toast.success(
      supplierPopup?.mode === "edit" ? "Supplier updated" : "Supplier added",
      {
        description: `"${supplier.supplierName}" was saved.`,
      }
    )
  }

  // ---- Delete confirmation --------------------------------------------------------

  const [deletingSupplier, setDeletingSupplier] =
    useState<SupplierRecord | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  const requestDeleteSupplier = (supplier: SupplierRecord) => {
    setDeletingSupplier(supplier)
    setDeleteConfirmText("")
  }

  const closeDeleteDialog = () => {
    setDeletingSupplier(null)
    setDeleteConfirmText("")
  }

  const isDeleteConfirmed =
    deletingSupplier !== null &&
    deleteConfirmText.trim() === deletingSupplier.supplierCode

  const confirmDeleteSupplier = () => {
    if (!deletingSupplier) return
    if (deleteConfirmText.trim() !== deletingSupplier.supplierCode) {
      toast.error("Supplier code doesn't match", {
        description: "Type the exact supplier code to confirm deletion.",
      })
      return
    }

    setSuppliers((prev) =>
      prev.filter((item) => item.id !== deletingSupplier.id)
    )
    toast.success("Supplier deleted", {
      description: `"${deletingSupplier.supplierName}" was removed.`,
    })
    closeDeleteDialog()
  }

  // ---- Search + pagination --------------------------------------------------------

  const filteredSuppliers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return suppliers

    return suppliers.filter(
      (supplier) =>
        supplier.supplierCode.toLowerCase().includes(query) ||
        supplier.supplierName.toLowerCase().includes(query) ||
        supplier.contactNumber.toLowerCase().includes(query) ||
        supplier.whatsappNumber.toLowerCase().includes(query) ||
        supplier.email.toLowerCase().includes(query)
    )
  }, [suppliers, searchQuery])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSuppliers.length / PAGE_SIZE)
  )
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedSuppliers = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE
    return filteredSuppliers.slice(start, start + PAGE_SIZE)
  }, [filteredSuppliers, safeCurrentPage])

  const paginationRange = useMemo(
    () => getPaginationRange(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages]
  )

  const startIndex =
    filteredSuppliers.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1
  const endIndex = Math.min(
    safeCurrentPage * PAGE_SIZE,
    filteredSuppliers.length
  )

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handleRefresh = () => {
    setSearchQuery("")
    setCurrentPage(1)
    toast("Refreshed", { description: "Supplier list reloaded." })
  }

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value)
    toast.success(`${label} copied`, { description: value })
  }

  return (
    <div className="w-full px-6 pb-6 lg:px-8 lg:pt-4 lg:pb-8">
      {/* ---- Header --------------------------------------------------------- */}
      <div className="-mt-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Building2 className="size-5 text-muted-foreground" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">Supplier Management</h1>
              <Badge variant="secondary" className="font-normal tabular-nums">
                {suppliers.length.toLocaleString()} total
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage your supplier records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            title="Refresh suppliers"
          >
            <RefreshCw className="size-4" />
          </Button>
          <Button type="button" onClick={openAddSupplier}>
            <Plus />
            Create New Supplier
          </Button>
        </div>
      </div>

      {/* ---- Search ------------------------------------------------------------- */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by name, phone, email or ID..."
          className="pl-9"
        />
      </div>

      {/* ---- Table -------------------------------------------------------------- */}
      <div className="overflow-x-auto rounded-lg border border-border/60 bg-card/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier Code</TableHead>
              <TableHead>Supplier Name</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Fixed Line</TableHead>
              <TableHead>Credit Period</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <p className="text-sm text-muted-foreground">
                    No suppliers match{" "}
                    {searchQuery ? "your search" : "your records"}.
                  </p>
                  {searchQuery && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="mt-1"
                      onClick={() => handleSearchChange("")}
                    >
                      Clear search
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginatedSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-mono text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(supplier.supplierCode, "Supplier code")
                      }
                      className="group inline-flex items-center gap-1.5 text-primary hover:text-foreground"
                      title="Copy supplier code"
                    >
                      {supplier.supplierCode}
                      <Copy className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  </TableCell>

                  <TableCell className="max-w-[220px] font-medium">
                    <span
                      className="block truncate"
                      title={supplier.supplierName}
                    >
                      {supplier.supplierName}
                    </span>
                  </TableCell>

                  <TableCell className="tabular-nums">
                    {supplier.whatsappNumber || "—"}
                  </TableCell>

                  <TableCell className="tabular-nums">
                    {supplier.contactNumber || "—"}
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {getCreditPeriodLabel(supplier.creditPeriodDays)}
                    </Badge>
                  </TableCell>

                  <TableCell className="max-w-[200px] text-muted-foreground">
                    <span className="block truncate" title={supplier.email}>
                      {supplier.email || "—"}
                    </span>
                  </TableCell>

                  <TableCell className="max-w-[240px] text-muted-foreground">
                    <span className="block truncate" title={supplier.address}>
                      {supplier.address}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={(triggerProps) => (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                            {...triggerProps}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        )}
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openViewSupplier(supplier)}
                        >
                          <Eye className="mr-2 size-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openEditSupplier(supplier)}
                        >
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            toast("More actions", {
                              description: "Coming soon.",
                            })
                          }
                        >
                          More
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => requestDeleteSupplier(supplier)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ---- Pagination ---------------------------------------------------------- */}
      {filteredSuppliers.length > 0 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex}-{endIndex} of{" "}
            {filteredSuppliers.length.toLocaleString()} suppliers
          </p>

          {totalPages > 1 && (
            <Pagination className="mx-0 w-fit">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      goToPage(safeCurrentPage - 1)
                    }}
                    aria-disabled={safeCurrentPage === 1}
                    className={
                      safeCurrentPage === 1
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>

                {paginationRange.map((page, index) =>
                  page === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === safeCurrentPage}
                        onClick={(e) => {
                          e.preventDefault()
                          goToPage(page)
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      goToPage(safeCurrentPage + 1)
                    }}
                    aria-disabled={safeCurrentPage === totalPages}
                    className={
                      safeCurrentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      {/* ---- Add / Edit / View supplier -------------------------------------------- */}
      <CreateNewSupplier
        open={supplierPopup !== null}
        onOpenChange={(nextOpen) => !nextOpen && closeSupplierPopup()}
        mode={supplierPopup?.mode ?? "create"}
        supplier={supplierPopup?.supplier ?? null}
        existingSuppliers={suppliers}
        onSubmit={handleSupplierSubmit}
      />

      {/* ---- Delete supplier confirmation -------------------------------------------- */}
      <AlertDialog
        open={Boolean(deletingSupplier)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeDeleteDialog()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete "{deletingSupplier?.supplierName}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm">
              <p className="font-medium text-destructive">
                This will permanently remove:
              </p>
              <ul className="mt-1.5 space-y-0.5 text-muted-foreground">
                <li>
                  Supplier code{" "}
                  <span className="font-mono">
                    {deletingSupplier?.supplierCode}
                  </span>
                </li>
                <li>
                  All contact details and credit terms on file for this supplier
                </li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="delete-supplier-confirm-input"
                className="text-sm font-medium"
              >
                Type{" "}
                <span className="font-mono font-semibold">
                  "{deletingSupplier?.supplierCode}"{" "}
                </span>
                to confirm
              </label>
              <Input
                id="delete-supplier-confirm-input"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={deletingSupplier?.supplierCode}
                aria-invalid={
                  deleteConfirmText.length > 0 && !isDeleteConfirmed
                }
                className={
                  deleteConfirmText.length > 0 && !isDeleteConfirmed
                    ? "border-destructive focus-visible:ring-destructive"
                    : undefined
                }
              />
              <p className="text-xs text-muted-foreground">
                This is case sensitive.
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!isDeleteConfirmed}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
              onClick={confirmDeleteSupplier}
            >
              Delete Supplier
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ViewAllSuppliers