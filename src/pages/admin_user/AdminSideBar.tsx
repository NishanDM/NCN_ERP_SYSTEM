"use client";

/**
 * AdminSideBar.tsx
 *
 * Left navigation — plain width-toggling div (w-16 <-> w-64), no resizable
 * panel. Top-level items with children (Customers, Stock, ...) are
 * accordions: clicking the row toggles `openMenu` and the nested tabs are
 * conditionally *mounted* (not just visually hidden), so there's nothing
 * that can clip them to zero height — they will always show when open.
 *
 * Route-aware: the group containing the current URL auto-expands, and its
 * matching leaf is highlighted, using the resolvers already exported from
 * adminRouteConfig.ts.
 */

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, LayoutDashboard, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  getActiveSectionFromAdminPath,
  getParentMenuFromAdminSection,
} from "../../routes/adminRouteConfig";
import { NAV_GROUPS } from "./adminNavConfig";

interface AdminSideBarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function AdminSideBar({ collapsed, onToggleCollapse }: AdminSideBarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const activeSectionId = getActiveSectionFromAdminPath(location.pathname);
  const parentMenu = getParentMenuFromAdminSection(activeSectionId);

  // Which group's dropdown is currently open. Auto-synced to whichever
  // group contains the active route, but the user can open/close freely.
  const [openMenu, setOpenMenu] = useState<string | null>(parentMenu ?? null);

  useEffect(() => {
    if (parentMenu) setOpenMenu(parentMenu);
  }, [parentMenu]);

  const toggleSubmenu = (id: string) => {
    setOpenMenu((prev) => (prev === id ? null : id));
  };

  const handleSelect = (route: string) => {
    navigate(route);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "relative flex h-screen flex-col border-r bg-slate-50/50 transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* ================= HEADER ================= */}
        <div className="flex h-14 items-center justify-between px-3 py-2">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                <LayoutDashboard size={16} />
              </div>
              <span className="font-bold tracking-tight">Admin User</span>
            </div>
          )}

          <Button variant="ghost" size="icon" onClick={onToggleCollapse} aria-label="Toggle navigation">
            <Menu size={20} />
          </Button>
        </div>

        <Separator />

        {/* ================= MENU ================= */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-2 py-4">
            {NAV_GROUPS.map((group) => {
              const Icon = group.icon;

              // Leaf group (no dropdown) — e.g. Dashboard, User Management
              if (!group.children) {
                const isActive = group.singleSectionId === activeSectionId;
                return (
                  <Tooltip key={group.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn("w-full justify-start", collapsed ? "justify-center px-0" : "px-3")}
                        onClick={() => group.singleRoute && handleSelect(group.singleRoute)}
                      >
                        <Icon className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
                        {!collapsed && <span className="flex-1 text-left">{group.label}</span>}
                      </Button>
                    </TooltipTrigger>
                    {collapsed && <TooltipContent side="right">{group.label}</TooltipContent>}
                  </Tooltip>
                );
              }

              // Parent group with nested tabs
              const isOpen = openMenu === group.id;
              const groupIsActive = group.children.some((c) => c.sectionId === activeSectionId);

              return (
                <div key={group.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isOpen || groupIsActive ? "secondary" : "ghost"}
                        className={cn("w-full justify-start", collapsed ? "justify-center px-0" : "px-3")}
                        onClick={() => {
                          // Clicking the tab always reveals its nested tabs —
                          // expand the rail first if it's currently collapsed.
                          if (collapsed) onToggleCollapse();
                          toggleSubmenu(group.id);
                        }}
                      >
                        <Icon className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
                        {!collapsed && <span className="flex-1 text-left">{group.label}</span>}
                        {!collapsed && (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                      </Button>
                    </TooltipTrigger>
                    {collapsed && <TooltipContent side="right">{group.label}</TooltipContent>}
                  </Tooltip>

                  {/* ================= NESTED TABS ================= */}
                  {/* Mounted only when open+expanded — nothing here relies on
                      an animated max-height, so it always renders visibly. */}
                  {!collapsed && isOpen && (
                    <div className="ml-4 mt-1 flex flex-col gap-1 border-l pl-2">
                      {group.children.map((child) => {
                        const isActive = child.sectionId === activeSectionId;
                        return (
                          <Button
                            key={child.sectionId}
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 justify-start text-muted-foreground hover:text-foreground",
                              isActive && "bg-primary/10 font-medium text-primary hover:text-primary"
                            )}
                            onClick={() => handleSelect(child.route)}
                          >
                            {child.label}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* ================= FOOTER ================= */}
        <div className="mt-auto p-4">
          <Separator className="mb-4" />
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="h-8 w-8 rounded-full bg-slate-200" />
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium">Alex Admin</span>
                <span className="truncate text-xs text-muted-foreground">alex@company.com</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}