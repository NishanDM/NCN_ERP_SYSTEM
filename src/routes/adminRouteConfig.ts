/**
 * adminRouteConfig.ts
 *
 * Single source of truth for every URL inside the admin area.
 *
 * ── What's inside ──────────────────────────────────────────────────────────
 *  1. ADMIN_ROUTES          – typed path constants (use everywhere instead of raw strings)
 *  2. ADMIN_SECTION_TO_ROUTE – old activeSection id  →  URL   (drives Sidebar navigation)
 *  3. ADMIN_ROUTE_TO_SECTION – URL  →  old activeSection id   (drives Sidebar highlight)
 *  4. ADMIN_ROUTE_METADATA  – label + parent, for breadcrumbs / page titles
 *
 * ── Adding a new admin route later ──────────────────────────────────────────
 *  1. Add the path to ADMIN_ROUTES.
 *  2. If it should appear in the sidebar, add an entry to ADMIN_SECTION_TO_ROUTE.
 *  3. Add a { label, parent } entry to ADMIN_ROUTE_METADATA.
 *  4. Add the matching <Route path="..." element={<YourComponent />} /> inside
 *     AdminRoutes.tsx (the component tree that actually renders pages).
 *  This file only ever describes URLs — it never imports a React component.
 */

import {
  createActiveSectionResolver,
  createBreadcrumbBuilder,
  createParentMenuResolver,
  buildReverseSectionMap,
  type DynamicSectionRule,
  type RouteMetadata as RouteMetadataEntry,
} from "./routeHelpers";

// ─────────────────────────────────────────────────────────────────────────────
// 1. ROUTE PATH CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const ADMIN_ROUTES = {
  // ── Admin root ────────────────────────────────────────────────────────────
  ADMIN: "/adminpage",

  // ── Invoice ───────────────────────────────────────────────────────────────
  INVOICE: "/adminpage/invoice",
  INVOICE_NEW: "/adminpage/invoice/new",
  INVOICE_ALL: "/adminpage/invoice/all",
  INVOICE_REPORTS: "/adminpage/invoice/reports",
  INVOICE_DRAFT: "/adminpage/invoice/draft/:invoiceId",

  // ── Customers ─────────────────────────────────────────────────────────────
  CUSTOMERS: "/adminpage/customers",
  CUSTOMERS_ALL: "/adminpage/customers/all",
  CUSTOMERS_PENDING: "/adminpage/customers/pending",
  CUSTOMERS_PURCHASE_ORDERS: "/adminpage/customers/purchase-orders",
  CUSTOMERS_PURCHASE_ORDERS_NEW: "/adminpage/customers/purchase-orders/new",
  CUSTOMERS_PURCHASE_ORDERS_EDIT: "/adminpage/customers/purchase-orders/edit/:poId",
  CUSTOMERS_PAYMENTS: "/adminpage/customers/payments",
  CUSTOMERS_CHEQUE_MANAGEMENT: "/adminpage/customers/cheque-management",
  CUSTOMERS_CREDIT_NOTE: "/adminpage/customers/credit-note",
  CUSTOMERS_CREDIT_NOTE_SETTLEMENTS: "/adminpage/customers/credit-note/settlements",
  CUSTOMERS_REPORTS: "/adminpage/customers/reports",

  // ── Stock ─────────────────────────────────────────────────────────────────
  STOCK: "/adminpage/stock",
  STOCK_ITEMS: "/adminpage/stock/items",
  STOCK_ADD: "/adminpage/stock/add",
  STOCK_CATEGORIES: "/adminpage/stock/categories",
  STOCK_REPORTS: "/adminpage/stock/reports",
  CUSTOMER_RETURNED_ITEMS_MANAGEMENT: "/adminpage/stock/customer-returned-items-management",

  // ── Suppliers ─────────────────────────────────────────────────────────────
  SUPPLIERS: "/adminpage/suppliers",
  SUPPLIERS_ALL: "/adminpage/suppliers/all",
  SUPPLIERS_OUTSTANDINGS: "/adminpage/suppliers/outstandings",
  SUPPLIERS_PAYMENTS_TRACKING: "/adminpage/suppliers/suppliers-payments-tracking",
  SUPPLIERS_DEBITNOTE_MANAGEMENT: "/adminpage/suppliers/suppliers-debitnote-management",
  SUPPLIERS_SETTLEMENTS: "/adminpage/suppliers/settlements",
  SUPPLIERS_REPORTS: "/adminpage/suppliers/reports",

  // ── Accounts ──────────────────────────────────────────────────────────────
  ACCOUNTS: "/adminpage/accounts",
  ACCOUNTS_DASHBOARD: "/adminpage/accounts/dashboard",
  ACCOUNTS_EXPENSES: "/adminpage/accounts/expenses",
  ACCOUNTS_REPORTS: "/adminpage/accounts/reports",

  // ── Purchase Orders & GRN ─────────────────────────────────────────────────
  PO_GRN: "/adminpage/po-grn",
  PO: "/adminpage/po-grn/po",
  GRN: "/adminpage/po-grn/grn",
  GRN_NEW: "/adminpage/po-grn/grn/new",
  GRN_SETTLEMENT: "/adminpage/po-grn/settlement",
  GRN_REPORTS: "/adminpage/po-grn/reports",

  // ── Sales Representative ──────────────────────────────────────────────────
  SALES_REP: "/adminpage/sales-rep",
  SALES_REP_MILEAGE: "/adminpage/sales-rep/mileage",
  SALES_REP_EXPENSES: "/adminpage/sales-rep/expenses",

  // ── Quotation ─────────────────────────────────────────────────────────────
  QUOTATION: "/adminpage/quotation",
  QUOTATION_ALL: "/adminpage/quotation/all",
  QUOTATION_REPORTS: "/adminpage/quotation/reports",

  // ── Users ─────────────────────────────────────────────────────────────────
  USERS: "/adminpage/users",
} as const;

/** Union type of every valid admin-area route */
export type AdminRoute = (typeof ADMIN_ROUTES)[keyof typeof ADMIN_ROUTES];

// ─────────────────────────────────────────────────────────────────────────────
// 2. SECTION ID → ROUTE  (Sidebar: navigate(ADMIN_SECTION_TO_ROUTE[sectionId]))
// ─────────────────────────────────────────────────────────────────────────────

export const ADMIN_SECTION_TO_ROUTE: Record<string, string> = {
  // Invoice
  "invoice-new": ADMIN_ROUTES.INVOICE_NEW,
  "invoice-all": ADMIN_ROUTES.INVOICE_ALL,
  "reports-invoice": ADMIN_ROUTES.INVOICE_REPORTS,

  // Customers
  "customers-all": ADMIN_ROUTES.CUSTOMERS_ALL,
  "customers-pending": ADMIN_ROUTES.CUSTOMERS_PENDING,
  "customers-purchase-orders": ADMIN_ROUTES.CUSTOMERS_PURCHASE_ORDERS,
  "customers-payments": ADMIN_ROUTES.CUSTOMERS_PAYMENTS,
  "customers-cheque-management": ADMIN_ROUTES.CUSTOMERS_CHEQUE_MANAGEMENT,
  "customers-credit-note": ADMIN_ROUTES.CUSTOMERS_CREDIT_NOTE,
  "customers-credit-note-settlements": ADMIN_ROUTES.CUSTOMERS_CREDIT_NOTE_SETTLEMENTS,
  "reports-customers": ADMIN_ROUTES.CUSTOMERS_REPORTS,

  // Stock
  "stock-items": ADMIN_ROUTES.STOCK_ITEMS,
  "stock-add": ADMIN_ROUTES.STOCK_ADD,
  "stock-categories": ADMIN_ROUTES.STOCK_CATEGORIES,
  "reports-stock": ADMIN_ROUTES.STOCK_REPORTS,
  "customer-returned-items-management": ADMIN_ROUTES.CUSTOMER_RETURNED_ITEMS_MANAGEMENT,

  // Suppliers
  "suppliers-all": ADMIN_ROUTES.SUPPLIERS_ALL,
  "suppliers-outstandings": ADMIN_ROUTES.SUPPLIERS_OUTSTANDINGS,
  "suppliers-settlements": ADMIN_ROUTES.SUPPLIERS_SETTLEMENTS,
  "suppliers-payments-tracking": ADMIN_ROUTES.SUPPLIERS_PAYMENTS_TRACKING,
  "suppliers-debitnote-management": ADMIN_ROUTES.SUPPLIERS_DEBITNOTE_MANAGEMENT,
  "reports-supplier": ADMIN_ROUTES.SUPPLIERS_REPORTS,

  // Accounts
  "accounts-dashboard": ADMIN_ROUTES.ACCOUNTS_DASHBOARD,
  "accounts-expenses": ADMIN_ROUTES.ACCOUNTS_EXPENSES,
  "reports-accounts": ADMIN_ROUTES.ACCOUNTS_REPORTS,

  // PO & GRN
  "po-all": ADMIN_ROUTES.PO,
  "grn-all": ADMIN_ROUTES.GRN,
  "grn-new": ADMIN_ROUTES.GRN_NEW,
  "grn-settlement": ADMIN_ROUTES.GRN_SETTLEMENT,
  "reports-po-grn": ADMIN_ROUTES.GRN_REPORTS,

  // Sales Rep
  "mileage-management": ADMIN_ROUTES.SALES_REP_MILEAGE,
  "sales-rep-expenses": ADMIN_ROUTES.SALES_REP_EXPENSES,

  // Quotation
  "quotation-all": ADMIN_ROUTES.QUOTATION_ALL,
  "reports-quotation": ADMIN_ROUTES.QUOTATION_REPORTS,

  // Users
  "user-management": ADMIN_ROUTES.USERS,
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. ROUTE → SECTION ID  (Sidebar: highlight ADMIN_ROUTE_TO_SECTION[pathname])
// ─────────────────────────────────────────────────────────────────────────────

export const ADMIN_ROUTE_TO_SECTION: Record<string, string> =
  buildReverseSectionMap(ADMIN_SECTION_TO_ROUTE);

/** Paths with a dynamic segment (`:invoiceId`, `:poId`, ...) don't have an
 *  exact entry in ADMIN_ROUTE_TO_SECTION, so they're resolved by prefix here
 *  instead — pointing back at whichever "all" list they were opened from. */
const ADMIN_DYNAMIC_SECTION_RULES: DynamicSectionRule[] = [
  { pathPrefix: "/adminpage/invoice/draft", sectionId: "invoice-all" },
  { pathPrefix: "/adminpage/customers/purchase-orders/edit", sectionId: "customers-purchase-orders" },
];

/**
 * Given the current pathname, returns the matching sidebar section id.
 *
 * Usage in Sidebar:
 *   const { pathname } = useLocation();
 *   const activeSection = getActiveSectionFromAdminPath(pathname);
 */
export const getActiveSectionFromAdminPath = createActiveSectionResolver(
  ADMIN_ROUTE_TO_SECTION,
  "accounts-dashboard",
  ADMIN_DYNAMIC_SECTION_RULES
);

/**
 * Given a sidebar section id, returns that section's parent accordion/menu id.
 * Used to keep the right accordion open when navigating directly to a URL.
 *
 * Usage in Sidebar:
 *   const [expandedMenu, setExpandedMenu] = useState(
 *     getParentMenuFromAdminSection(getActiveSectionFromAdminPath(location.pathname))
 *   );
 */
export const getParentMenuFromAdminSection = createParentMenuResolver(
  ["invoice", "customers", "stock", "suppliers", "accounts", "po-grn", "sales-rep", "quotation", "reports", "user"],
  {
    "mileage-management": "sales-rep",
    "sales-rep-expenses": "sales-rep",
    "po-all": "po-grn",
    "grn-all": "po-grn",
    "grn-new": "po-grn",
    "grn-settlement": "po-grn",
    "reports-po-grn": "po-grn",
    "user-management": "user-management", // leaf-level menu, no accordion
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. ROUTE METADATA  (breadcrumbs, <title>, navigation helpers)
// ─────────────────────────────────────────────────────────────────────────────

export const ADMIN_ROUTE_METADATA: Record<string, RouteMetadataEntry> = {
  [ADMIN_ROUTES.ADMIN]: { label: "Dashboard" },

  // ── Invoice ───────────────────────────────────────────────────────────────
  [ADMIN_ROUTES.INVOICE]: { label: "Invoice", parent: ADMIN_ROUTES.ADMIN },
  [ADMIN_ROUTES.INVOICE_NEW]: { label: "New Invoice", parent: ADMIN_ROUTES.INVOICE },
  [ADMIN_ROUTES.INVOICE_ALL]: { label: "All Invoices", parent: ADMIN_ROUTES.INVOICE },
  [ADMIN_ROUTES.INVOICE_REPORTS]: { label: "Invoice Reports", parent: ADMIN_ROUTES.INVOICE },

  // ── Customers ─────────────────────────────────────────────────────────────
  [ADMIN_ROUTES.CUSTOMERS]: { label: "Customers", parent: ADMIN_ROUTES.ADMIN },
  [ADMIN_ROUTES.CUSTOMERS_ALL]: { label: "All Customers", parent: ADMIN_ROUTES.CUSTOMERS },
  [ADMIN_ROUTES.CUSTOMERS_PENDING]: { label: "Pending Customers", parent: ADMIN_ROUTES.CUSTOMERS },
  [ADMIN_ROUTES.CUSTOMERS_PURCHASE_ORDERS]: { label: "Customer Purchase Orders", parent: ADMIN_ROUTES.CUSTOMERS },
  [ADMIN_ROUTES.CUSTOMERS_PAYMENTS]: { label: "Customer Payments", parent: ADMIN_ROUTES.CUSTOMERS },
  [ADMIN_ROUTES.CUSTOMERS_CHEQUE_MANAGEMENT]: { label: "Cheque Management", parent: ADMIN_ROUTES.CUSTOMERS },
  [ADMIN_ROUTES.CUSTOMERS_CREDIT_NOTE]: { label: "Credit Notes", parent: ADMIN_ROUTES.CUSTOMERS },
  [ADMIN_ROUTES.CUSTOMERS_CREDIT_NOTE_SETTLEMENTS]: { label: "Credit Note Settlements", parent: ADMIN_ROUTES.CUSTOMERS_CREDIT_NOTE },
  [ADMIN_ROUTES.CUSTOMERS_REPORTS]: { label: "Customer Reports", parent: ADMIN_ROUTES.CUSTOMERS },

  // ── Stock ─────────────────────────────────────────────────────────────────
  [ADMIN_ROUTES.STOCK]: { label: "Stock", parent: ADMIN_ROUTES.ADMIN },
  [ADMIN_ROUTES.STOCK_ITEMS]: { label: "Stock Items", parent: ADMIN_ROUTES.STOCK },
  [ADMIN_ROUTES.STOCK_ADD]: { label: "Add Stock Item", parent: ADMIN_ROUTES.STOCK },
  [ADMIN_ROUTES.STOCK_CATEGORIES]: { label: "Categories", parent: ADMIN_ROUTES.STOCK },
  [ADMIN_ROUTES.STOCK_REPORTS]: { label: "Stock Reports", parent: ADMIN_ROUTES.STOCK },
  [ADMIN_ROUTES.CUSTOMER_RETURNED_ITEMS_MANAGEMENT]: { label: "Customer Returned Items", parent: ADMIN_ROUTES.STOCK },

  // ── Suppliers ─────────────────────────────────────────────────────────────
  [ADMIN_ROUTES.SUPPLIERS]: { label: "Suppliers", parent: ADMIN_ROUTES.ADMIN },
  [ADMIN_ROUTES.SUPPLIERS_ALL]: { label: "All Suppliers", parent: ADMIN_ROUTES.SUPPLIERS },
  [ADMIN_ROUTES.SUPPLIERS_OUTSTANDINGS]: { label: "Supplier Outstandings", parent: ADMIN_ROUTES.SUPPLIERS },
  [ADMIN_ROUTES.SUPPLIERS_PAYMENTS_TRACKING]: { label: "Supplier Payments Tracking", parent: ADMIN_ROUTES.SUPPLIERS },
  [ADMIN_ROUTES.SUPPLIERS_DEBITNOTE_MANAGEMENT]: { label: "Supplier Debit Notes", parent: ADMIN_ROUTES.SUPPLIERS },
  [ADMIN_ROUTES.SUPPLIERS_SETTLEMENTS]: { label: "Supplier Settlements", parent: ADMIN_ROUTES.SUPPLIERS },
  [ADMIN_ROUTES.SUPPLIERS_REPORTS]: { label: "Supplier Reports", parent: ADMIN_ROUTES.SUPPLIERS },

  // ── Accounts ──────────────────────────────────────────────────────────────
  [ADMIN_ROUTES.ACCOUNTS]: { label: "Accounts", parent: ADMIN_ROUTES.ADMIN },
  [ADMIN_ROUTES.ACCOUNTS_DASHBOARD]: { label: "Accounts Dashboard", parent: ADMIN_ROUTES.ACCOUNTS },
  [ADMIN_ROUTES.ACCOUNTS_EXPENSES]: { label: "Expenses", parent: ADMIN_ROUTES.ACCOUNTS },
  [ADMIN_ROUTES.ACCOUNTS_REPORTS]: { label: "Accounts Reports", parent: ADMIN_ROUTES.ACCOUNTS },

  // ── PO & GRN ──────────────────────────────────────────────────────────────
  [ADMIN_ROUTES.PO_GRN]: { label: "PO & GRN", parent: ADMIN_ROUTES.ADMIN },
  [ADMIN_ROUTES.PO]: { label: "Purchase Orders", parent: ADMIN_ROUTES.PO_GRN },
  [ADMIN_ROUTES.GRN]: { label: "Goods Received Notes", parent: ADMIN_ROUTES.PO_GRN },
  [ADMIN_ROUTES.GRN_NEW]: { label: "New GRN", parent: ADMIN_ROUTES.GRN },
  [ADMIN_ROUTES.GRN_SETTLEMENT]: { label: "GRN Settlement", parent: ADMIN_ROUTES.PO_GRN },
  [ADMIN_ROUTES.GRN_REPORTS]: { label: "PO & GRN Reports", parent: ADMIN_ROUTES.PO_GRN },

  // ── Sales Rep ─────────────────────────────────────────────────────────────
  [ADMIN_ROUTES.SALES_REP]: { label: "Sales Rep", parent: ADMIN_ROUTES.ADMIN },
  [ADMIN_ROUTES.SALES_REP_MILEAGE]: { label: "Mileage", parent: ADMIN_ROUTES.SALES_REP },
  [ADMIN_ROUTES.SALES_REP_EXPENSES]: { label: "Sales Rep Expenses", parent: ADMIN_ROUTES.SALES_REP },

  // ── Quotation ─────────────────────────────────────────────────────────────
  [ADMIN_ROUTES.QUOTATION]: { label: "Quotation", parent: ADMIN_ROUTES.ADMIN },
  [ADMIN_ROUTES.QUOTATION_ALL]: { label: "All Quotations", parent: ADMIN_ROUTES.QUOTATION },
  [ADMIN_ROUTES.QUOTATION_REPORTS]: { label: "Quotation Reports", parent: ADMIN_ROUTES.QUOTATION },

  // ── Users ─────────────────────────────────────────────────────────────────
  [ADMIN_ROUTES.USERS]: { label: "User Management", parent: ADMIN_ROUTES.ADMIN },
};

/**
 * Build a breadcrumb trail for the given pathname.
 *
 * Usage:
 *   const crumbs = buildAdminBreadcrumbs(location.pathname);
 *   // → [{ label: "Dashboard", path: "/adminpage" },
 *   //    { label: "Customers", path: "/adminpage/customers" },
 *   //    { label: "All Customers", path: "/adminpage/customers/all" }]
 */
export const buildAdminBreadcrumbs = createBreadcrumbBuilder(ADMIN_ROUTE_METADATA);

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic-segment route builders
// ─────────────────────────────────────────────────────────────────────────────

/** Build a navigable URL for a specific draft invoice. */
export function adminInvoiceDraftRoute(invoiceId: string): string {
  return `/adminpage/invoice/draft/${invoiceId}`;
}

/** Build a navigable URL for editing a specific customer purchase order. */
export function adminCustomerPurchaseOrderEditRoute(poId: string): string {
  return `/adminpage/customers/purchase-orders/edit/${poId}`;
}