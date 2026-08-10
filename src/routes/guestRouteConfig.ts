/**
 * guestRouteConfig.ts
 *
 * Single source of truth for every URL inside the guest area.
 *
 * Guest access is read-only by design (see GuestUserPage / GuestRoutes), so
 * this file intentionally stays small: a dashboard and a couple of view-only
 * listings. Anything added here should have no corresponding "new"/"edit"
 * route — that's the tell that a section has outgrown guest access and
 * belongs in normalUserRouteConfig.ts or adminRouteConfig.ts instead.
 *
 * ── Adding a new guest route later ──────────────────────────────────────────
 *  1. Add the path to GUEST_ROUTES.
 *  2. If it should appear in the sidebar, add an entry to GUEST_SECTION_TO_ROUTE.
 *  3. Add a { label, parent } entry to GUEST_ROUTE_METADATA.
 *  4. Add the matching <Route path="..." element={<YourComponent />} /> inside
 *     GuestRoutes.tsx.
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

export const GUEST_ROUTES = {
  // ── Root ──────────────────────────────────────────────────────────────────
  GUEST: "/guestpage",

  // ── Stock (view-only) ─────────────────────────────────────────────────────
  STOCK_CATALOG: "/guestpage/catalog",

  // ── Quotation (view-only) ─────────────────────────────────────────────────
  QUOTATION_ALL: "/guestpage/quotation",
} as const;

/** Union type of every valid guest-area route */
export type GuestRoute = (typeof GUEST_ROUTES)[keyof typeof GUEST_ROUTES];

// ─────────────────────────────────────────────────────────────────────────────
// 2. SECTION ID → ROUTE
// ─────────────────────────────────────────────────────────────────────────────

export const GUEST_SECTION_TO_ROUTE: Record<string, string> = {
  "stock-catalog": GUEST_ROUTES.STOCK_CATALOG,
  "quotation-all": GUEST_ROUTES.QUOTATION_ALL,
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. ROUTE → SECTION ID
// ─────────────────────────────────────────────────────────────────────────────

export const GUEST_ROUTE_TO_SECTION: Record<string, string> =
  buildReverseSectionMap(GUEST_SECTION_TO_ROUTE);

export const getActiveSectionFromGuestPath = createActiveSectionResolver(
  GUEST_ROUTE_TO_SECTION,
  "stock-catalog"
);

export const getParentMenuFromGuestSection = createParentMenuResolver(["stock", "quotation"]);

// ─────────────────────────────────────────────────────────────────────────────
// 4. ROUTE METADATA
// ─────────────────────────────────────────────────────────────────────────────

export const GUEST_ROUTE_METADATA: Record<string, RouteMetadataEntry> = {
  [GUEST_ROUTES.GUEST]: { label: "Dashboard" },
  [GUEST_ROUTES.STOCK_CATALOG]: { label: "Item Catalog", parent: GUEST_ROUTES.GUEST },
  [GUEST_ROUTES.QUOTATION_ALL]: { label: "Quotations", parent: GUEST_ROUTES.GUEST },
};

export const buildGuestBreadcrumbs = createBreadcrumbBuilder(GUEST_ROUTE_METADATA);