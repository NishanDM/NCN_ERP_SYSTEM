/**
 * normalUserRouteConfig.ts
 *
 * Single source of truth for every URL inside the normal-user area.
 *
 * Deliberately a smaller module set than adminRouteConfig.ts — day-to-day
 * operational work (invoicing, customer handling, stock, receiving goods,
 * quotations) without the back-office sections (Accounts, Suppliers ledger,
 * User Management) that stay admin-only. Promote a route here from the admin
 * file (or vice-versa) simply by moving the constant + section + metadata
 * entries between the two files — the shape is identical.
 *
 * ── Adding a new normal-user route later ────────────────────────────────────
 *  1. Add the path to NORMAL_ROUTES.
 *  2. If it should appear in the sidebar, add an entry to NORMAL_SECTION_TO_ROUTE.
 *  3. Add a { label, parent } entry to NORMAL_ROUTE_METADATA.
 *  4. Add the matching <Route path="..." element={<YourComponent />} /> inside
 *     NormalUserRoutes.tsx.
 */

import {
  createActiveSectionResolver,
  createBreadcrumbBuilder,
  createParentMenuResolver,
  buildReverseSectionMap,
  type RouteMetadata as RouteMetadataEntry,
} from "./routeHelpers";

// ─────────────────────────────────────────────────────────────────────────────
// 1. ROUTE PATH CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const NORMAL_ROUTES = {
  // ── Root ──────────────────────────────────────────────────────────────────
  NORMAL: "/normalpage",

  // ── Invoice ───────────────────────────────────────────────────────────────
  INVOICE: "/normalpage/invoice",
  INVOICE_NEW: "/normalpage/invoice/new",
  INVOICE_ALL: "/normalpage/invoice/all",

  // ── Customers ─────────────────────────────────────────────────────────────
  CUSTOMERS: "/normalpage/customers",
  CUSTOMERS_ALL: "/normalpage/customers/all",
  CUSTOMERS_PAYMENTS: "/normalpage/customers/payments",

  // ── Stock ─────────────────────────────────────────────────────────────────
  STOCK: "/normalpage/stock",
  STOCK_ITEMS: "/normalpage/stock/items",
  STOCK_ADD: "/normalpage/stock/add",

  // ── Purchase Orders & GRN (receiving goods, no supplier ledger access) ────
  PO_GRN: "/normalpage/po-grn",
  GRN: "/normalpage/po-grn/grn",
  GRN_NEW: "/normalpage/po-grn/grn/new",

  // ── Quotation ─────────────────────────────────────────────────────────────
  QUOTATION: "/normalpage/quotation",
  QUOTATION_ALL: "/normalpage/quotation/all",

  // ── Profile ───────────────────────────────────────────────────────────────
  PROFILE: "/normalpage/profile",
} as const;

/** Union type of every valid normal-user-area route */
export type NormalRoute = (typeof NORMAL_ROUTES)[keyof typeof NORMAL_ROUTES];

// ─────────────────────────────────────────────────────────────────────────────
// 2. SECTION ID → ROUTE
// ─────────────────────────────────────────────────────────────────────────────

export const NORMAL_SECTION_TO_ROUTE: Record<string, string> = {
  "invoice-new": NORMAL_ROUTES.INVOICE_NEW,
  "invoice-all": NORMAL_ROUTES.INVOICE_ALL,

  "customers-all": NORMAL_ROUTES.CUSTOMERS_ALL,
  "customers-payments": NORMAL_ROUTES.CUSTOMERS_PAYMENTS,

  "stock-items": NORMAL_ROUTES.STOCK_ITEMS,
  "stock-add": NORMAL_ROUTES.STOCK_ADD,

  "grn-all": NORMAL_ROUTES.GRN,
  "grn-new": NORMAL_ROUTES.GRN_NEW,

  "quotation-all": NORMAL_ROUTES.QUOTATION_ALL,

  "my-profile": NORMAL_ROUTES.PROFILE,
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. ROUTE → SECTION ID
// ─────────────────────────────────────────────────────────────────────────────

export const NORMAL_ROUTE_TO_SECTION: Record<string, string> =
  buildReverseSectionMap(NORMAL_SECTION_TO_ROUTE);

export const getActiveSectionFromNormalPath = createActiveSectionResolver(
  NORMAL_ROUTE_TO_SECTION,
  "invoice-all"
);

export const getParentMenuFromNormalSection = createParentMenuResolver(
  ["invoice", "customers", "stock", "grn", "quotation"],
  {
    "grn-all": "po-grn",
    "grn-new": "po-grn",
    "my-profile": "my-profile", // leaf-level, no accordion
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. ROUTE METADATA
// ─────────────────────────────────────────────────────────────────────────────

export const NORMAL_ROUTE_METADATA: Record<string, RouteMetadataEntry> = {
  [NORMAL_ROUTES.NORMAL]: { label: "Dashboard" },

  [NORMAL_ROUTES.INVOICE]: { label: "Invoice", parent: NORMAL_ROUTES.NORMAL },
  [NORMAL_ROUTES.INVOICE_NEW]: { label: "New Invoice", parent: NORMAL_ROUTES.INVOICE },
  [NORMAL_ROUTES.INVOICE_ALL]: { label: "All Invoices", parent: NORMAL_ROUTES.INVOICE },

  [NORMAL_ROUTES.CUSTOMERS]: { label: "Customers", parent: NORMAL_ROUTES.NORMAL },
  [NORMAL_ROUTES.CUSTOMERS_ALL]: { label: "All Customers", parent: NORMAL_ROUTES.CUSTOMERS },
  [NORMAL_ROUTES.CUSTOMERS_PAYMENTS]: { label: "Customer Payments", parent: NORMAL_ROUTES.CUSTOMERS },

  [NORMAL_ROUTES.STOCK]: { label: "Stock", parent: NORMAL_ROUTES.NORMAL },
  [NORMAL_ROUTES.STOCK_ITEMS]: { label: "Stock Items", parent: NORMAL_ROUTES.STOCK },
  [NORMAL_ROUTES.STOCK_ADD]: { label: "Add Stock Item", parent: NORMAL_ROUTES.STOCK },

  [NORMAL_ROUTES.PO_GRN]: { label: "Goods Received", parent: NORMAL_ROUTES.NORMAL },
  [NORMAL_ROUTES.GRN]: { label: "Goods Received Notes", parent: NORMAL_ROUTES.PO_GRN },
  [NORMAL_ROUTES.GRN_NEW]: { label: "New GRN", parent: NORMAL_ROUTES.GRN },

  [NORMAL_ROUTES.QUOTATION]: { label: "Quotation", parent: NORMAL_ROUTES.NORMAL },
  [NORMAL_ROUTES.QUOTATION_ALL]: { label: "All Quotations", parent: NORMAL_ROUTES.QUOTATION },

  [NORMAL_ROUTES.PROFILE]: { label: "My Profile", parent: NORMAL_ROUTES.NORMAL },
};

export const buildNormalBreadcrumbs = createBreadcrumbBuilder(NORMAL_ROUTE_METADATA);