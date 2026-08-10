/**
 * routeHelpers.ts
 *
 * Generic, role-agnostic plumbing shared by adminRouteConfig.ts,
 * normalUserRouteConfig.ts, and guestRouteConfig.ts.
 *
 * Nothing in this file knows about "customers" or "stock" or any specific
 * section — it just turns a role's ROUTES / SECTION_TO_ROUTE / ROUTE_METADATA
 * maps into the derived lookups (reverse map, active-section resolver,
 * breadcrumb builder) so that logic isn't hand-duplicated three times.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared cross-role routes
// ─────────────────────────────────────────────────────────────────────────────

/** Routes that exist outside any role's namespace (the login screen, etc.). */
export const SHARED_ROUTES = {
  LOGIN: "/login",
} as const;

export type SharedRoute = (typeof SHARED_ROUTES)[keyof typeof SHARED_ROUTES];

// ─────────────────────────────────────────────────────────────────────────────
// Route metadata (breadcrumbs, page titles)
// ─────────────────────────────────────────────────────────────────────────────

export interface RouteMetadata {
  /** Human-readable page title */
  label: string;
  /** Parent route path (for breadcrumb chains) */
  parent?: string;
}

export interface Breadcrumb {
  label: string;
  path: string;
}

/**
 * Given a role's ROUTE_METADATA map, returns a `buildBreadcrumbs(pathname)`
 * function scoped to that role.
 */
export function createBreadcrumbBuilder(
  routeMetadata: Record<string, RouteMetadata>
): (pathname: string) => Breadcrumb[] {
  return function buildBreadcrumbs(pathname: string): Breadcrumb[] {
    const crumbs: Breadcrumb[] = [];
    let current: string | undefined = pathname;

    while (current && routeMetadata[current]) {
      crumbs.unshift({ label: routeMetadata[current].label, path: current });
      current = routeMetadata[current].parent;
    }

    return crumbs;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar section <-> route resolution
// ─────────────────────────────────────────────────────────────────────────────

/** Builds the URL -> sectionId reverse lookup from a sectionId -> URL map. */
export function buildReverseSectionMap(
  sectionToRoute: Record<string, string>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(sectionToRoute).map(([section, route]) => [route, section])
  );
}

/** A prefix-based override for paths with dynamic segments (`:id`, etc.) that
 *  should still highlight a specific sidebar section. */
export interface DynamicSectionRule {
  pathPrefix: string;
  sectionId: string;
}

/**
 * Given a role's routeToSection map, returns a `getActiveSectionFromPath(pathname)`
 * function scoped to that role.
 */
export function createActiveSectionResolver(
  routeToSection: Record<string, string>,
  fallbackSectionId: string,
  dynamicRules: DynamicSectionRule[] = []
): (pathname: string) => string {
  return function getActiveSectionFromPath(pathname: string): string {
    for (const rule of dynamicRules) {
      if (pathname.startsWith(rule.pathPrefix)) return rule.sectionId;
    }

    if (routeToSection[pathname]) return routeToSection[pathname];

    // Fallback: longest prefix match (handles nested/dynamic segments)
    const match = Object.entries(routeToSection)
      .filter(([route]) => pathname.startsWith(route))
      .sort((a, b) => b[0].length - a[0].length)[0];

    return match ? match[1] : fallbackSectionId;
  };
}

/**
 * Given a list of top-level menu prefixes and a small override table for
 * sections whose id doesn't start with their menu's own prefix, returns a
 * `getParentMenuFromSection(sectionId)` function scoped to that role.
 */
export function createParentMenuResolver(
  menuPrefixes: string[],
  overrides: Record<string, string> = {}
): (sectionId: string) => string | null {
  return function getParentMenuFromSection(sectionId: string): string | null {
    if (overrides[sectionId]) return overrides[sectionId];
    return menuPrefixes.find((prefix) => sectionId.startsWith(prefix)) ?? null;
  };
}