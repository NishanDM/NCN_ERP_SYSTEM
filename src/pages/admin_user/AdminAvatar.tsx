"use client";

/**
 * AdminAvatar.tsx
 *
 * Avatar button + dropdown for profile / settings / logout. Extracted from
 * AdminTopBar so the top bar just renders <AdminAvatar />. User info is a
 * local placeholder (CURRENT_USER) — swap for your real session source
 * once auth is wired back in, and update handleLogout to match.
 */

import { useNavigate } from "react-router-dom";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings, User } from "lucide-react";

// Swap this for whatever session/user source you use once auth is wired
// back in (context, a query hook, props from a parent, etc).
const CURRENT_USER = {
  email: "admin@ncnholdings.lk",
  role: "Administrator",
  avatarUrl: "",
};

function AdminAvatar() {
  const navigate = useNavigate();
  const user = CURRENT_USER;

  const handleLogout = () => {
    // Wire this back up to your logout flow once auth is reintroduced.
    navigate("/login");
  };

  const initials = user?.email?.substring(0, 2).toUpperCase() || "??";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex h-9 w-9 items-center justify-center rounded-full outline-none hover:bg-accent">
        <Avatar className="h-9 w-9">
          <AvatarImage src={user?.avatarUrl} alt={user?.email || "User"} />
          <AvatarFallback className="bg-primary/10 text-xs text-primary">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

    <DropdownMenuContent className="w-56" align="end">
      <DropdownMenuGroup>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.email}</p>
            <p className="text-xs capitalize leading-none text-muted-foreground">{user?.role}</p>
          </div>
        </DropdownMenuLabel>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />

      <DropdownMenuGroup>
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />

      <DropdownMenuGroup>
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AdminAvatar;