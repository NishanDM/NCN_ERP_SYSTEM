import React, { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  ChevronRight,
  Folder,
  Layers,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

//==========    COMPONENTS ===========================

import { StockCategoryPopup, StockCategoryDeleteDialog } from "./StockCategoryEditDeletePopup"
import {
  getCategoryItemCount,
  getTotalItemCount,
  INITIAL_STOCK_CATEGORIES,
  type StockCategory,
} from "./StockCategoriesData"

type StockSubCategory = StockCategory["subCategories"][number]

// ---- Local UI state types ---------------------------------------------------

type NamePopupState =
  | { mode: "category"; category: StockCategory | null } // null = creating
  | { mode: "subCategory"; category: StockCategory; sub: StockSubCategory }

type DeleteState =
  | { mode: "category"; category: StockCategory }
  | { mode: "subCategory"; category: StockCategory; sub: StockSubCategory }

// ---- Component --------------------------------------------------------------

function StockCategories() {
  const [categories, setCategories] = useState<StockCategory[]>(INITIAL_STOCK_CATEGORIES)

  const [namePopup, setNamePopup] = useState<NamePopupState | null>(null)
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null)

  const [addingSubFor, setAddingSubFor] = useState<string | null>(null)
  const [newSubName, setNewSubName] = useState("")

  const [searchQuery, setSearchQuery] = useState("")

  const totalItemCount = useMemo(() => getTotalItemCount(categories), [categories])

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return categories

    return categories.filter((category) => {
      const nameMatches = category.name.toLowerCase().includes(query)
      const subMatches = category.subCategories.some((sub) =>
        sub.name.toLowerCase().includes(query)
      )
      return nameMatches || subMatches
    })
  }, [categories, searchQuery])

  // ---- Refresh --------------------------------------------------------------

  const handleRefresh = () => {
    setCategories(INITIAL_STOCK_CATEGORIES)
    setAddingSubFor(null)
    setSearchQuery("")
    toast("Categories refreshed", {
      description: "The category list has been reset to its default state.",
    })
  }

  const openCreateCategory = () => setNamePopup({ mode: "category", category: null })
  const openRenameCategory = (category: StockCategory) =>
    setNamePopup({ mode: "category", category })
  const openRenameSubCategory = (category: StockCategory, sub: StockSubCategory) =>
    setNamePopup({ mode: "subCategory", category, sub })
  const closeNamePopup = () => setNamePopup(null)

  const handleNamePopupSubmit = (name: string) => {
    if (!namePopup) return

    if (namePopup.mode === "category") {
      const { category } = namePopup
      if (category) {
        setCategories((prev) =>
          prev.map((cat) => (cat.id === category.id ? { ...cat, name } : cat))
        )
      } else {
        const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`
        setCategories((prev) => [...prev, { id, name, subCategories: [] }])
      }
      return
    }

    const { category, sub } = namePopup
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id !== category.id
          ? cat
          : {
              ...cat,
              subCategories: cat.subCategories.map((s) =>
                s.id === sub.id ? { ...s, name } : s
              ),
            }
      )
    )
  }

  const namePopupExistingNames =
    namePopup?.mode === "category"
      ? categories.map((cat) => cat.name)
      : namePopup?.mode === "subCategory"
        ? namePopup.category.subCategories.map((s) => s.name)
        : []

  // ---- Delete flow (category or sub-category) -------------------------------

  const requestDeleteCategory = (category: StockCategory) =>
    setDeleteState({ mode: "category", category })
  const requestDeleteSubCategory = (category: StockCategory, sub: StockSubCategory) =>
    setDeleteState({ mode: "subCategory", category, sub })
  const closeDeleteDialog = () => setDeleteState(null)

  const confirmDelete = () => {
    if (!deleteState) return

    if (deleteState.mode === "category") {
      const { category } = deleteState
      setCategories((prev) => prev.filter((cat) => cat.id !== category.id))
      toast.success("Category deleted", {
        description: `"${category.name}" and its sub categories were removed.`,
      })
    } else {
      const { category, sub } = deleteState
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id !== category.id
            ? cat
            : { ...cat, subCategories: cat.subCategories.filter((s) => s.id !== sub.id) }
        )
      )
      toast.success("Sub Category deleted", {
        description: `"${sub.name}" was removed from "${category.name}".`,
      })
    }

    closeDeleteDialog()
  }

  // ---- Add sub-category -----------------------------

  const startAddSubCategory = (categoryId: string) => {
    setAddingSubFor(categoryId)
    setNewSubName("")
  }

  const cancelAddSubCategory = () => {
    setAddingSubFor(null)
    setNewSubName("")
  }

  const handleAddSubCategory = (e: React.FormEvent, category: StockCategory) => {
    e.preventDefault()
    const trimmed = newSubName.trim()
    if (!trimmed) return

    const isDuplicate = category.subCategories.some(
      (sub) => sub.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (isDuplicate) {
      toast.error("Sub-category already exists", {
        description: `"${category.name}" already has a "${trimmed}" sub category.`,
      })
      return
    }

    const newSub = {
      id: `${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      name: trimmed,
      itemCount: 0,
    }

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === category.id
          ? { ...cat, subCategories: [...cat.subCategories, newSub] }
          : cat
      )
    )
    cancelAddSubCategory()
  }

  return (
    <div className="w-full max-w-7xl p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Layers className="size-5 text-muted-foreground" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Stock Categories</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {categories.length} categories · {totalItemCount.toLocaleString()} total items
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh categories">
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={openCreateCategory}>
            <Plus />
            New Category
          </Button>
        </div>
      </div>

      {/* ---- Search ----------------------------------------------------------- */}
      {categories.length > 0 && (
        <div className="relative mb-4 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              title="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      )}

      {/* ---- Category list ---------------------------------------------------- */}
      {categories.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No categories yet. Create one to start organizing your stock.
        </p>
      ) : filteredCategories.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No categories match "{searchQuery}".
        </p>
      ) : (
        <Accordion multiple className="flex flex-col gap-2">
          {filteredCategories.map((category) => {
            const itemCount = getCategoryItemCount(category)
            const subCount = category.subCategories.length

            return (
              <AccordionItem
                key={category.id}
                value={category.id}
                className="rounded-lg border border-border/60 bg-card/50 px-3 last:border-b"
              >
                <div className="flex items-center gap-1">
                  <AccordionTrigger className="group flex w-full flex-1 items-center justify-between gap-3 py-3 hover:no-underline [&>svg:last-child]:hidden">
                    <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Folder className="size-4 text-muted-foreground" />
                      </span>
                      <span className="truncate font-medium">{category.name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className="gap-1 font-normal">
                        <Tag className="size-3" />
                        {subCount} sub
                      </Badge>
                      <Badge variant="secondary" className="gap-1 font-normal">
                        <Package className="size-3" />
                        {itemCount} items
                      </Badge>
                    </div>
                  </AccordionTrigger>

                  {/* Sibling to the trigger (not nested in it) so these
                      clicks don't also toggle the accordion row. */}
                  <div className="flex shrink-0 items-center gap-0.5 pl-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground"
                      title="Rename category"
                      onClick={() => openRenameCategory(category)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      title="Delete category"
                      onClick={() => requestDeleteCategory(category)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <AccordionContent className="pb-3">
                  <div className="ml-4 flex flex-col gap-0.5 border-l border-border pl-4">
                    {category.subCategories.length === 0 && addingSubFor !== category.id && (
                      <p className="py-1.5 text-sm text-muted-foreground">
                        No sub-categories yet.
                      </p>
                    )}

                    {category.subCategories.map((sub) => (
                      <div
                        key={sub.id}
                        className="group/sub flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
                            <Tag className="size-3 text-muted-foreground" />
                          </span>
                          <span className="truncate text-sm">{sub.name}</span>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <Badge variant="secondary" className="font-normal">
                            {sub.itemCount}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground opacity-0 group-hover/sub:opacity-100 focus-visible:opacity-100"
                            title="Rename sub category"
                            onClick={() => openRenameSubCategory(category, sub)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground opacity-0 hover:text-destructive group-hover/sub:opacity-100 focus-visible:opacity-100"
                            title="Delete sub category"
                            onClick={() => requestDeleteSubCategory(category, sub)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {addingSubFor === category.id ? (
                      <form
                        onSubmit={(e) => handleAddSubCategory(e, category)}
                        className="flex items-center gap-2 pt-1"
                      >
                        <Input
                          autoFocus
                          value={newSubName}
                          onChange={(e) => setNewSubName(e.target.value)}
                          placeholder="Sub-category name"
                          className="h-8"
                        />
                        <Button type="submit" size="sm">
                          Add
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={cancelAddSubCategory}
                        >
                          Cancel
                        </Button>
                      </form>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-fit gap-1 px-2 text-muted-foreground"
                        onClick={() => startAddSubCategory(category.id)}
                      >
                        <Plus className="size-3.5" />
                        Add sub category
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

      {namePopup && (
        <StockCategoryPopup
          open={Boolean(namePopup)}
          onOpenChange={(open) => {
            if (!open) closeNamePopup()
          }}
          mode={namePopup.mode}
          editingName={
            namePopup.mode === "category" ? namePopup.category?.name : namePopup.sub.name
          }
          existingNames={namePopupExistingNames}
          onSubmit={handleNamePopupSubmit}
        />
      )}

      {/* ---- Delete category or sub-category confirmation ------------------------- */}
      {deleteState && (
        <StockCategoryDeleteDialog
          open={Boolean(deleteState)}
          onOpenChange={(open) => {
            if (!open) closeDeleteDialog()
          }}
          title={
            deleteState.mode === "category"
              ? `Delete "${deleteState.category.name}"?`
              : `Delete "${deleteState.sub.name}"?`
          }
          matchName={
            deleteState.mode === "category" ? deleteState.category.name : deleteState.sub.name
          }
          summaryLines={
            deleteState.mode === "category"
              ? [
                  `${deleteState.category.subCategories.length} sub categor${
                    deleteState.category.subCategories.length === 1 ? "y" : "ies"
                  }`,
                  `${getCategoryItemCount(deleteState.category).toLocaleString()} item${
                    getCategoryItemCount(deleteState.category) === 1 ? "" : "s"
                  }`,
                ]
              : [
                  `${deleteState.sub.itemCount.toLocaleString()} item${
                    deleteState.sub.itemCount === 1 ? "" : "s"
                  }`,
                ]
          }
          confirmLabel={deleteState.mode === "category" ? "Delete Category" : "Delete Sub Category"}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}

export default StockCategories