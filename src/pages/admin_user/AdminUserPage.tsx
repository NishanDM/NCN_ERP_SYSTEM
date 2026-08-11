"use client";

/**
 * AdminUserPage.tsx
 *
 * Shell for the whole /adminpage/* area — plain flex layout now (no
 * react-resizable-panels). AdminSideBar is a controlled component: this
 * file owns the single `collapsed` boolean and hands the toggle down to
 * both the sidebar (which renders its own header toggle button) and, if
 * you add one later, any mobile hamburger button in the top bar.
 *
 * Swap the <PlaceholderPage /> elements below for real page components as
 * they're built — routing, breadcrumbs, and sidebar highlighting all key
 * off adminRouteConfig.ts, so nothing else needs to change.
 */

import AllInvoices from "../../invoices/AllInvoices"; // adjust path to where you place these files
import CreateNewInvoice from "../../invoices/CreateNewInvoice";
import InvoiceReports from "../../invoices/InvoiceReports";

import StockItems from "../../stock/StockItems";
import AddStockItem from "../../stock/AddStockItem";
import StockCategories from "../../stock/StockCategories";
import StockReports from "../../stock/StockReports";
import StockCustomerReturnedItems from "../../stock/StockCustomerReturnedItems";

import AllQuotations from "../../quotations/AllQuotations";
import QuotationReports from "../../quotations/QuotationReports";


import React, { useState } from "react";
import { Routes, Route, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

import {
  ADMIN_ROUTES,
  ADMIN_ROUTE_METADATA
} from "../../routes/adminRouteConfig";

import AdminSideBar from "./AdminSideBar";
import AdminTopBar from "./AdminTopBar";

// ─────────────────────────────────────────────────────────────────────────────
// Placeholder page renderer — shows the route's own metadata until the real
// page component is wired in.
// ─────────────────────────────────────────────────────────────────────────────

function PlaceholderPage({ routePath, dynamicLabel }: { routePath: string; dynamicLabel?: string }) {
  const meta = ADMIN_ROUTE_METADATA[routePath];
  const params = useParams();
  return (
    <div className="flex h-full flex-col items-start justify-center gap-2 rounded-xl border border-dashed bg-background px-8 py-16">
      <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px] font-medium">
        Page stub
      </Badge>
      <h2 className="text-xl font-semibold">{meta?.label ?? dynamicLabel ?? "Untitled page"}</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        This is a placeholder for <code className="rounded bg-muted px-1 py-0.5 font-mono text-[12px]">{routePath}</code>.
        Replace <code className="rounded bg-muted px-1 py-0.5 font-mono text-[12px]">&lt;PlaceholderPage /&gt;</code> with
        the real component once it's built.
      </p>
      {Object.keys(params).length > 0 && (
        <pre className="mt-2 rounded-lg bg-muted px-3 py-2 text-[11px]">{JSON.stringify(params, null, 2)}</pre>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout wrapper — plain flex, sidebar + top bar + content
// ─────────────────────────────────────────────────────────────────────────────

function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => setCollapsed((prev) => !prev);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AdminSideBar collapsed={collapsed} onToggleCollapse={toggleSidebar} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar />
        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Route table — every static ADMIN_ROUTES entry plus the two dynamic builders
// ─────────────────────────────────────────────────────────────────────────────

const STATIC_ROUTE_PATHS: string[] = Object.values(ADMIN_ROUTES).filter((route) => !route.includes(":"));

// ─────────────────────────────────────────────────────────────────────────────
// Real page components — add an entry here as each page gets built.
// Routes not listed here still fall back to <PlaceholderPage />.
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_ROUTE_COMPONENTS: Partial<Record<string, React.ComponentType>> = {
  [ADMIN_ROUTES.INVOICE_ALL]: AllInvoices,
  [ADMIN_ROUTES.INVOICE_NEW]: CreateNewInvoice,
  [ADMIN_ROUTES.INVOICE_REPORTS]: InvoiceReports,

  [ADMIN_ROUTES.STOCK_ITEMS]: StockItems,
  [ADMIN_ROUTES.STOCK_ADD]: AddStockItem,
  [ADMIN_ROUTES.STOCK_CATEGORIES]: StockCategories,
  [ADMIN_ROUTES.STOCK_REPORTS]: StockReports,
  [ADMIN_ROUTES.CUSTOMER_RETURNED_ITEMS_MANAGEMENT]: StockCustomerReturnedItems,

  [ADMIN_ROUTES.QUOTATION_ALL]: AllQuotations,
  [ADMIN_ROUTES.QUOTATION_REPORTS]: QuotationReports,
};

function AdminUserPage() {
  return (
    <Routes>
      <Route
        element={
          <AdminLayout>
            <Routes>
              {STATIC_ROUTE_PATHS.map((routePath) => {
  // Strip the "/adminpage" prefix so these nest correctly under
  // the parent <Route path="/adminpage/*"> declared in App.tsx.
  const relativePath = routePath.replace(ADMIN_ROUTES.ADMIN, "") || "/";
  const RealComponent = ADMIN_ROUTE_COMPONENTS[routePath];

  return (
    <Route
      key={routePath}
      path={relativePath === "/" ? undefined : relativePath.replace(/^\//, "")}
      index={relativePath === "/"}
      element={RealComponent ? <RealComponent /> : <PlaceholderPage routePath={routePath} />}
    />
  );
})}

              <Route
                path={ADMIN_ROUTES.INVOICE_DRAFT.replace(`${ADMIN_ROUTES.ADMIN}/`, "")}
                element={<PlaceholderPage routePath={ADMIN_ROUTES.INVOICE_DRAFT} dynamicLabel="Invoice Draft" />}
              />
              <Route
                path={ADMIN_ROUTES.CUSTOMERS_PURCHASE_ORDERS_EDIT.replace(`${ADMIN_ROUTES.ADMIN}/`, "")}
                element={
                  <PlaceholderPage
                    routePath={ADMIN_ROUTES.CUSTOMERS_PURCHASE_ORDERS_EDIT}
                    dynamicLabel="Edit Purchase Order"
                  />
                }
              />

              <Route path="*" element={<PlaceholderPage routePath={ADMIN_ROUTES.ACCOUNTS_DASHBOARD} dynamicLabel="Dashboard" />} />
            </Routes>
          </AdminLayout>
        }
        path="/*"
      />
    </Routes>
  );
}

export default AdminUserPage;
