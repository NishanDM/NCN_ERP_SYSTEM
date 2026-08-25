import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Boxes,
  DollarSign,
  Layers,
  PackageX,
  RefreshCw,
  Search,
  Tags,
  TrendingDown,
  TrendingUp,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

//==========    COMPONENTS ===========================

import {
  formatCurrency,
  getQuantityStatus,
  INITIAL_STOCK_ITEMS,
  isLowStock,
  type StockItemRecord,
} from "./StockItemsData"
import {
  calculateCategoryBreakdown,
  calculateStockReportSummary,
  calculateSupplierBreakdown,
  formatGeneratedTimestamp,
  formatPercent,
} from "./StockReportsData"

// ---- Stat card theming ------------------------------------------------------------

type StatTheme = "blue" | "violet" | "emerald" | "teal" | "amber" | "rose"

const STAT_THEME_CLASSES: Record<StatTheme, { card: string; icon: string; label: string }> = {
  blue: {
    card: "border-blue-100 bg-blue-50 dark:border-blue-950 dark:bg-blue-950/40",
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
    label: "text-blue-700 dark:text-blue-400",
  },
  violet: {
    card: "border-violet-100 bg-violet-50 dark:border-violet-950 dark:bg-violet-950/40",
    icon: "bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-400",
    label: "text-violet-700 dark:text-violet-400",
  },
  emerald: {
    card: "border-emerald-100 bg-emerald-50 dark:border-emerald-950 dark:bg-emerald-950/40",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400",
    label: "text-emerald-700 dark:text-emerald-400",
  },
  teal: {
    card: "border-teal-100 bg-teal-50 dark:border-teal-950 dark:bg-teal-950/40",
    icon: "bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-400",
    label: "text-teal-700 dark:text-teal-400",
  },
  amber: {
    card: "border-amber-100 bg-amber-50 dark:border-amber-950 dark:bg-amber-950/40",
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400",
    label: "text-amber-700 dark:text-amber-400",
  },
  rose: {
    card: "border-rose-100 bg-rose-50 dark:border-rose-950 dark:bg-rose-950/40",
    icon: "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-400",
    label: "text-rose-700 dark:text-rose-400",
  },
}

interface StatCardData {
  label: string
  value: string
  icon: LucideIcon
  theme: StatTheme
}

function StatCard({ label, value, icon: Icon, theme }: StatCardData) {
  const classes = STAT_THEME_CLASSES[theme]
  return (
    <div className={cn("rounded-xl border p-4", classes.card)}>
      <div className="flex items-center gap-2">
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", classes.icon)}>
          <Icon className="size-4" />
        </span>
        <p className={cn("text-xs font-medium", classes.label)}>{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

// ---- Category / supplier breakdown list -------------------------------------------

interface BreakdownRow {
  name: string
  value: number
  metricLabel: string
}

function BreakdownList({ rows, barClassName }: { rows: BreakdownRow[]; barClassName: string }) {
  const maxValue = Math.max(1, ...rows.map((row) => row.value))

  return (
    <div className="divide-y divide-border/60">
      {rows.map((row) => {
        const widthPercent = (row.value / maxValue) * 100
        return (
          <div key={row.name} className="py-2.5 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium">{row.name}</span>
              <span className="shrink-0 text-muted-foreground">
                {formatCurrency(row.value)} · {row.metricLabel}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", barClassName)}
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---- Component --------------------------------------------------------------

function StockReports() {
  const [items] = useState<StockItemRecord[]>(INITIAL_STOCK_ITEMS)
  const [generatedAt, setGeneratedAt] = useState(() => new Date())

  const [lookupQuery, setLookupQuery] = useState("")
  const [selectedLookupItem, setSelectedLookupItem] = useState<StockItemRecord | null>(null)

  // ---- Aggregations ------------------------

  const summary = useMemo(() => calculateStockReportSummary(items), [items])
  const categoryBreakdown = useMemo(() => calculateCategoryBreakdown(items), [items])
  const supplierBreakdown = useMemo(() => calculateSupplierBreakdown(items), [items])

  const categoryRows: BreakdownRow[] = categoryBreakdown.map((category) => ({
    name: category.categoryName,
    value: category.value,
    metricLabel: `${category.units.toLocaleString()} units`,
  }))

  const supplierRows: BreakdownRow[] = supplierBreakdown.map((supplier) => ({
    name: supplier.supplierName,
    value: supplier.value,
    metricLabel: `${supplier.itemCount.toLocaleString()} item${supplier.itemCount === 1 ? "" : "s"}`,
  }))

  const statCards: StatCardData[] = [
    { label: "Total Items", value: summary.totalItems.toLocaleString(), icon: Boxes, theme: "blue" },
    { label: "Total Quantity", value: summary.totalQuantity.toLocaleString(), icon: Layers, theme: "blue" },
    { label: "Stock Value (Cost)", value: formatCurrency(summary.stockValueCost), icon: Wallet, theme: "violet" },
    { label: "Stock Value (Sell)", value: formatCurrency(summary.stockValueSell), icon: DollarSign, theme: "emerald" },
    { label: "Potential Profit", value: formatCurrency(summary.potentialProfit), icon: TrendingUp, theme: "emerald" },
    { label: "Avg Margin", value: formatPercent(summary.avgMarginPercent), icon: TrendingUp, theme: "teal" },
    { label: "Low Stock", value: summary.lowStockCount.toLocaleString(), icon: TrendingDown, theme: "amber" },
    { label: "Out of Stock", value: summary.outOfStockCount.toLocaleString(), icon: PackageX, theme: "rose" },
  ]

  // ---- Item Stock Movement Lookup ------------------------------------------------
  

  const lookupMatches = useMemo(() => {
    const query = lookupQuery.trim().toLowerCase()
    if (!query) return []
    return items
      .filter(
        (item) =>
          item.itemCode.toLowerCase().includes(query) ||
          item.itemName.toLowerCase().includes(query) ||
          item.brand.toLowerCase().includes(query) ||
          item.stockKeepingUnit.toLowerCase().includes(query)
      )
      .slice(0, 6)
  }, [items, lookupQuery])

  const handleLookupChange = (value: string) => {
    setLookupQuery(value)
    setSelectedLookupItem(null)
  }

  const clearLookup = () => {
    setLookupQuery("")
    setSelectedLookupItem(null)
  }

  const lookupStatus = selectedLookupItem ? getQuantityStatus(selectedLookupItem) : null
  const lookupStatusLabel =
    lookupStatus === "out_of_stock" ? "Out of Stock" : lookupStatus === "low_stock" ? "Low Stock" : "In Stock"

  const handleRefresh = () => {
    setGeneratedAt(new Date())
    toast("Report refreshed", { description: "Stock figures recalculated from the latest data." })
  }

  return (
    <div className="w-full px-6 pb-6 lg:px-8 lg:pt-4 lg:pb-8">
      {/* ---- Header --------------------------------------------------------- */}
      <div className="-mt-4 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Stock Reports Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Generated {formatGeneratedTimestamp(generatedAt)}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleRefresh}>
          <RefreshCw />
          Refresh
        </Button>
      </div>

      {/* ---- Stat cards ------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* ---- Item Status Breakdown --------------------------------------------- */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">Item Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 py-4 text-center dark:border-emerald-950 dark:bg-emerald-950/40">
              <p className="text-2xl font-semibold text-emerald-700 dark:text-emerald-400">
                {summary.activeCount.toLocaleString()}
              </p>
              <p className="mt-1 text-xs font-medium text-emerald-700/80 dark:text-emerald-400/80">
                Active
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 py-4 text-center">
              <p className="text-2xl font-semibold">{summary.inactiveCount.toLocaleString()}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">Inactive</p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 py-4 text-center dark:border-amber-950 dark:bg-amber-950/40">
              <p className="text-2xl font-semibold text-amber-700 dark:text-amber-400">
                {summary.discontinuedCount.toLocaleString()}
              </p>
              <p className="mt-1 text-xs font-medium text-amber-700/80 dark:text-amber-400/80">
                Discontinued
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---- Item Stock Movement Lookup ------------------------------------------ */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Search className="size-4 text-muted-foreground" />
            Item Stock Movement Lookup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={lookupQuery}
              onChange={(e) => handleLookupChange(e.target.value)}
              placeholder="Search by name, code, brand, part no..."
              className="pl-9"
            />
          </div>

          {lookupQuery.trim() !== "" &&
            !selectedLookupItem &&
            (lookupMatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items match "{lookupQuery}".</p>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border">
                {lookupMatches.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedLookupItem(item)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{item.itemName}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.itemCode}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {item.quantity} in stock
                    </span>
                  </button>
                ))}
              </div>
            ))}

          {selectedLookupItem && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{selectedLookupItem.itemName}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {selectedLookupItem.itemCode} · {selectedLookupItem.categoryName} /{" "}
                    {selectedLookupItem.subCategoryName}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={clearLookup}>
                  Clear
                </Button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Current Stock</p>
                  <p className="font-semibold">{selectedLookupItem.quantity} units</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reorder Level</p>
                  <p className="font-semibold">{selectedLookupItem.reorderLevel} units</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stock Value (Cost)</p>
                  <p className="font-semibold">
                    {formatCurrency(selectedLookupItem.costPrice * selectedLookupItem.quantity)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p
                    className={cn(
                      "font-semibold",
                      isLowStock(selectedLookupItem)
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {lookupStatusLabel}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Movement history (stock in/out over time) isn't tracked yet — this shows the
                item's current snapshot only.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- Value breakdowns --------------------------------------------------- */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Tags className="size-4 text-muted-foreground" />
              Stock Value by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stock items yet.</p>
            ) : (
              <BreakdownList rows={categoryRows} barClassName="bg-violet-500" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Truck className="size-4 text-muted-foreground" />
              Top Suppliers by Stock Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            {supplierRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No suppliers yet.</p>
            ) : (
              <BreakdownList rows={supplierRows} barClassName="bg-blue-500" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default StockReports