"use client";

/**
 * AdminNotifications.tsx
 *
 * Bell icon + popover. Self-contained state — swap `notifications` for a
 * real query/websocket source later without touching AdminTopBar.
 */

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface AppNotification {
  id: number;
  title: string;
  description: string;
  time: string;
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 1,
    title: "GRN settlement pending",
    description: "GRN-2291 from Lanka Distributors needs settlement review.",
    time: "12 mins ago",
    unread: true,
  },
  {
    id: 2,
    title: "New purchase order",
    description: "Customer PO #CPO-0456 was submitted by Nadeesha Silva.",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: 3,
    title: "Cheque cleared",
    description: "Cheque #003321 for Rs. 145,000.00 has cleared successfully.",
    time: "3 hours ago",
    unread: false,
  },
  {
    id: 4,
    title: "Stock below threshold",
    description: "'Galvanized Sheet 4x8' has 6 units left in Main Warehouse.",
    time: "Yesterday",
    unread: false,
  },
];

export function AdminNotifications() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-destructive" />
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <span className="text-[10px] font-medium uppercase text-muted-foreground">
              {unreadCount} Unread
            </span>
          )}
        </div>

        <ScrollArea className="h-[350px]">
          <div className="flex flex-col">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex flex-col gap-1 border-b px-4 py-3 transition-colors last:border-0 hover:bg-muted/50",
                  notification.unread && "bg-primary/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-sm font-medium leading-none", notification.unread && "text-primary")}>
                    {notification.title}
                  </p>
                  {notification.unread && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">{notification.description}</p>
                <p className="mt-1 text-[10px] text-muted-foreground/70">{notification.time}</p>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-2">
          <Button variant="ghost" className="w-full justify-center text-xs" onClick={markAllRead}>
            Mark all as read
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default AdminNotifications;