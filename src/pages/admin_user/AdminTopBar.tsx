"use client";

import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { buildAdminBreadcrumbs } from "../../routes/adminRouteConfig";
import AdminNotifications from "./AdminNotifications";
import AdminAvatar from "./AdminAvatar";

function Breadcrumbs() {
  const location = useLocation();
  const navigate = useNavigate();
  const crumbs = useMemo(() => buildAdminBreadcrumbs(location.pathname), [location.pathname]);

  if (crumbs.length === 0) {
    return <span className="text-sm font-medium">Admin</span>;
  }

  return (
    <ol className="flex items-center gap-1.5 text-sm">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <li key={crumb.path} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
            {isLast ? (
              <span className="font-medium">{crumb.label}</span>
            ) : (
              <button
                type="button"
                onClick={() => navigate(crumb.path)}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function AdminTopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-6">
      <div className="flex flex-1 min-w-0">
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-2">
        <AdminNotifications />
        <AdminAvatar />
      </div>
    </header>
  );
}