/**
 * adminNavConfig.ts
 *
 * Sidebar nav structure — which icon + label + route each top-level group
 * and its nested tabs map to. Kept separate from adminRouteConfig.ts (which
 * only ever describes URLs) so this file can freely mix in icons/UI concerns.
 */

import {
  ClipboardList,
  FileSignature,
  LayoutDashboard,
  PackageSearch,
  Receipt,
  Route as RouteIcon,
  Truck,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { ADMIN_ROUTES } from "../../routes/adminRouteConfig";

export interface NavLeaf {
  sectionId: string;
  label: string;
  route: string;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Section id + route to navigate to when the group itself is clicked (leaf groups only, no dropdown). */
  singleSectionId?: string;
  singleRoute?: string;
  children?: NavLeaf[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    singleSectionId: "accounts-dashboard",
    singleRoute: ADMIN_ROUTES.ACCOUNTS_DASHBOARD,
  },
  {
    id: "invoice",
    label: "Invoice",
    icon: Receipt,
    children: [
      { sectionId: "invoice-new", label: "New Invoice", route: ADMIN_ROUTES.INVOICE_NEW },
      { sectionId: "invoice-all", label: "All Invoices", route: ADMIN_ROUTES.INVOICE_ALL },
      { sectionId: "reports-invoice", label: "Reports", route: ADMIN_ROUTES.INVOICE_REPORTS },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
    children: [
      { sectionId: "customers-all", label: "All Customers", route: ADMIN_ROUTES.CUSTOMERS_ALL },
      { sectionId: "customers-pending", label: "Pending", route: ADMIN_ROUTES.CUSTOMERS_PENDING },
      {
        sectionId: "customers-purchase-orders",
        label: "Purchase Orders",
        route: ADMIN_ROUTES.CUSTOMERS_PURCHASE_ORDERS,
      },
      { sectionId: "customers-payments", label: "Payments", route: ADMIN_ROUTES.CUSTOMERS_PAYMENTS },
      {
        sectionId: "customers-cheque-management",
        label: "Cheque Management",
        route: ADMIN_ROUTES.CUSTOMERS_CHEQUE_MANAGEMENT,
      },
      { sectionId: "customers-credit-note", label: "Credit Notes", route: ADMIN_ROUTES.CUSTOMERS_CREDIT_NOTE },
      {
        sectionId: "customers-credit-note-settlements",
        label: "Credit Note Settlements",
        route: ADMIN_ROUTES.CUSTOMERS_CREDIT_NOTE_SETTLEMENTS,
      },
      { sectionId: "reports-customers", label: "Reports", route: ADMIN_ROUTES.CUSTOMERS_REPORTS },
    ],
  },
  {
    id: "stock",
    label: "Stock",
    icon: PackageSearch,
    children: [
      { sectionId: "stock-items", label: "Stock Items", route: ADMIN_ROUTES.STOCK_ITEMS },
      { sectionId: "stock-add", label: "Add Stock Item", route: ADMIN_ROUTES.STOCK_ADD },
      { sectionId: "stock-categories", label: "Categories", route: ADMIN_ROUTES.STOCK_CATEGORIES },
      { sectionId: "reports-stock", label: "Reports", route: ADMIN_ROUTES.STOCK_REPORTS },
      {
        sectionId: "customer-returned-items-management",
        label: "Customer Returned Items",
        route: ADMIN_ROUTES.CUSTOMER_RETURNED_ITEMS_MANAGEMENT,
      },
    ],
  },
  {
    id: "suppliers",
    label: "Suppliers",
    icon: Truck,
    children: [
      { sectionId: "suppliers-all", label: "All Suppliers", route: ADMIN_ROUTES.SUPPLIERS_ALL },
      { sectionId: "suppliers-outstandings", label: "Outstandings", route: ADMIN_ROUTES.SUPPLIERS_OUTSTANDINGS },
      {
        sectionId: "suppliers-payments-tracking",
        label: "Payments Tracking",
        route: ADMIN_ROUTES.SUPPLIERS_PAYMENTS_TRACKING,
      },
      {
        sectionId: "suppliers-debitnote-management",
        label: "Debit Notes",
        route: ADMIN_ROUTES.SUPPLIERS_DEBITNOTE_MANAGEMENT,
      },
      { sectionId: "suppliers-settlements", label: "Settlements", route: ADMIN_ROUTES.SUPPLIERS_SETTLEMENTS },
      { sectionId: "reports-supplier", label: "Reports", route: ADMIN_ROUTES.SUPPLIERS_REPORTS },
    ],
  },
  {
    id: "accounts",
    label: "Accounts",
    icon: Wallet,
    children: [
      { sectionId: "accounts-dashboard", label: "Dashboard", route: ADMIN_ROUTES.ACCOUNTS_DASHBOARD },
      { sectionId: "accounts-expenses", label: "Expenses", route: ADMIN_ROUTES.ACCOUNTS_EXPENSES },
      { sectionId: "reports-accounts", label: "Reports", route: ADMIN_ROUTES.ACCOUNTS_REPORTS },
    ],
  },
  {
    id: "po-grn",
    label: "PO & GRN",
    icon: ClipboardList,
    children: [
      { sectionId: "po-all", label: "Purchase Orders", route: ADMIN_ROUTES.PO },
      { sectionId: "grn-all", label: "Goods Received Notes", route: ADMIN_ROUTES.GRN },
      { sectionId: "grn-new", label: "New GRN", route: ADMIN_ROUTES.GRN_NEW },
      { sectionId: "grn-settlement", label: "Settlement", route: ADMIN_ROUTES.GRN_SETTLEMENT },
      { sectionId: "reports-po-grn", label: "Reports", route: ADMIN_ROUTES.GRN_REPORTS },
    ],
  },
  {
    id: "sales-rep",
    label: "Sales Rep",
    icon: RouteIcon,
    children: [
      { sectionId: "mileage-management", label: "Mileage", route: ADMIN_ROUTES.SALES_REP_MILEAGE },
      { sectionId: "sales-rep-expenses", label: "Expenses", route: ADMIN_ROUTES.SALES_REP_EXPENSES },
    ],
  },
  {
    id: "quotation",
    label: "Quotation",
    icon: FileSignature,
    children: [
      { sectionId: "quotation-all", label: "All Quotations", route: ADMIN_ROUTES.QUOTATION_ALL },
      { sectionId: "reports-quotation", label: "Reports", route: ADMIN_ROUTES.QUOTATION_REPORTS },
    ],
  },
  {
    id: "user-management",
    label: "User Management",
    icon: UserCog,
    singleSectionId: "user-management",
    singleRoute: ADMIN_ROUTES.USERS,
  },
];