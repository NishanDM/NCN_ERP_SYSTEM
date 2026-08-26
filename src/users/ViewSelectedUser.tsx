import React from "react"
import { XIcon, User, Mail, Phone, ShieldCheck, Lock, Building, Tag, FileText } from "lucide-react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getUserFullName, type UserRecord } from "./usersData"

interface ViewSelectedUserProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserRecord | null
}

function ViewSelectedUser({ open, onOpenChange, user }: ViewSelectedUserProps) {
  if (!user) return null

  const fullName = getUserFullName(user)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop overlay with blur effect */}
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />

        <DialogPrimitive.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2",
            "max-h-[85vh] gap-4 overflow-hidden rounded-xl bg-popover p-6 text-sm text-popover-foreground",
            "shadow-2xl ring-1 ring-foreground/10 outline-none sm:max-w-lg",
            "duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border/60 pb-3 pr-6">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-base">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-lg font-bold text-foreground">
                    {fullName}
                  </h2>
                  <Badge variant="outline" className="font-mono text-xs uppercase">
                    {user.userId}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  User Code: <span className="font-mono font-bold text-foreground">{user.userCode}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Close button */}
          <DialogPrimitive.Close
            render={
              <Button variant="ghost" size="icon-sm" className="absolute top-4 right-4" />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* User Details Body */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
            {/* Contact Details Grid */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-card p-2.5 space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Mail className="size-3 text-primary" /> Email
                </span>
                <p className="font-semibold text-foreground truncate">{user.email}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-2.5 space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Phone className="size-3 text-emerald-600" /> WhatsApp Number
                </span>
                <p className="font-semibold text-foreground font-mono">
                  {user.countryCode} {user.whatsappNumber}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-2.5 space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Building className="size-3" /> Department
                </span>
                <p className="font-semibold text-foreground">{user.department} Department</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-2.5 space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Tag className="size-3" /> User Type
                </span>
                <Badge variant="secondary" className="capitalize text-[10px]">
                  {user.userType}
                </Badge>
              </div>
            </div>

            {/* Account Status & Lock Details */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 space-y-1">
                <span className="text-muted-foreground">Account Status</span>
                <div>
                  <Badge
                    variant={user.status === "active" ? "secondary" : "outline"}
                    className={cn(
                      "capitalize text-[10px]",
                      user.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {user.status}
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Lock className="size-3 text-amber-600" /> Lock Status
                </span>
                <div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      user.isLocked
                        ? "bg-amber-50 text-amber-700 border-amber-200 font-semibold"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}
                  >
                    {user.isLocked ? "Locked" : "Unlocked"}
                  </Badge>
                </div>
              </div>
            </div>

            {user.isLocked && user.lockReason && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-amber-800 space-y-0.5 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                <span className="font-semibold">Lock Reason:</span>
                <p>{user.lockReason}</p>
              </div>
            )}

            {/* Privileges Badges */}
            <div className="space-y-1.5 rounded-lg border border-border/60 bg-card p-3">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-primary" /> Assigned Privileges
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {user.privileges.billMaker && <Badge variant="outline">Bill Maker</Badge>}
                {user.privileges.grnMaker && <Badge variant="outline">GRN Maker</Badge>}
                {user.privileges.userCreator && <Badge variant="outline">User Creator</Badge>}
                {user.privileges.billEditer && <Badge variant="outline">Bill Editer</Badge>}
                {user.privileges.adminPrivilege && (
                  <Badge variant="default" className="bg-primary">Admin Privilege</Badge>
                )}
                {!Object.values(user.privileges).some(Boolean) && (
                  <span className="text-muted-foreground italic">No privileges assigned</span>
                )}
              </div>
            </div>

            {/* Remarks */}
            {user.remarks && (
              <div className="space-y-1 rounded-lg border border-border/60 bg-muted/30 p-3">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <FileText className="size-3.5" /> Remarks / Description
                </span>
                <p className="text-muted-foreground">{user.remarks}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="-mx-6 -mb-6 flex items-center justify-end border-t bg-muted/50 p-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export default ViewSelectedUser
