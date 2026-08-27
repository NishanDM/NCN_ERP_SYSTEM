import React, { useState, useEffect } from "react"
import { Eye, EyeOff, XIcon, UserCheck, Check, AlertCircle, Lock, ShieldCheck } from "lucide-react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import {
  COUNTRY_CODES,
  DEPARTMENT_OPTIONS,
  type UserRecord,
  type UserType,
  type Department,
  type UserPrivileges,
} from "./usersData"

interface EditSelectedUserProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserRecord | null
  onUserUpdated: (updatedUser: UserRecord) => void
}

function EditSelectedUser({
  open,
  onOpenChange,
  user,
  onUserUpdated,
}: EditSelectedUserProps) {
  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [userType, setUserType] = useState<UserType>("general")
  const [countryCode, setCountryCode] = useState("+94")
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [userCode, setUserCode] = useState("")
  const [department, setDepartment] = useState<Department>("General")

  const [privileges, setPrivileges] = useState<UserPrivileges>({
    billMaker: false,
    grnMaker: false,
    userCreator: false,
    billEditer: false,
    adminPrivilege: false,
  })
  const [status, setStatus] = useState<"active" | "inactive">("active")
  const [isLocked, setIsLocked] = useState(false)
  const [lockReason, setLockReason] = useState("")
  const [remarks, setRemarks] = useState("")

  // Pre-fill form fields when modal opens or user changes
  useEffect(() => {
    if (open && user) {
      setFirstName(user.firstName)
      setMiddleName(user.middleName || "")
      setLastName(user.lastName)
      setEmail(user.email)
      setPassword(user.password || "")
      setConfirmPassword(user.password || "")
      setShowPassword(false)
      setShowConfirmPassword(false)
      setUserType(user.userType)
      setCountryCode(user.countryCode || "+94")
      setWhatsappNumber(user.whatsappNumber)
      setUserCode(user.userCode)
      setDepartment(user.department)
      setPrivileges({ ...user.privileges })
      setStatus(user.status)
      setIsLocked(user.isLocked)
      setLockReason(user.lockReason || "")
      setRemarks(user.remarks || "")
    }
  }, [open, user])

  if (!user) return null

  // Password matching validation logic
  const isPasswordEntered = password.length > 0 || confirmPassword.length > 0
  const isPasswordMatched = password === confirmPassword

  // Handle privilege checkbox toggle
  const togglePrivilege = (key: keyof UserPrivileges) => {
    setPrivileges((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Handle save changes
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Validation Error", { description: "First name and last name are required." })
      return
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("Validation Error", { description: "Please provide a valid email address." })
      return
    }

    if (isPasswordEntered && !isPasswordMatched) {
      toast.error("Validation Error", { description: "Passwords must match." })
      return
    }

    if (!userCode.trim() || userCode.length !== 4 || isNaN(Number(userCode))) {
      toast.error("Validation Error", { description: "User Code must be a 4-digit number." })
      return
    }

    const updatedUser: UserRecord = {
      ...user,
      firstName,
      middleName,
      lastName,
      email,
      password: password || user.password,
      userCode,
      countryCode,
      whatsappNumber,
      userType,
      department,
      privileges,
      status,
      isLocked,
      lockReason: isLocked ? lockReason : "",
      remarks,
    }

    onUserUpdated(updatedUser)
    toast.success("User Details Updated!", {
      description: `${firstName} ${lastName} (${user.userId}) was updated successfully.`,
    })
    onOpenChange(false)
  }

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
            "max-h-[90vh] gap-4 overflow-hidden rounded-xl bg-popover p-6 text-sm text-popover-foreground",
            "shadow-2xl ring-1 ring-foreground/10 outline-none sm:max-w-2xl",
            "duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border/60 pb-3 pr-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserCheck className="size-5" />
              </span>
              <div>
                <h2 className="font-heading text-lg font-bold tracking-tight text-foreground">
                  Edit User Details ({user.userId})
                </h2>
                <p className="text-xs text-muted-foreground">
                  Modify profile information, privileges, and account status
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

          {/* Scrollable Form Body */}
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
            {/* User Name 3 parts */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">User Name (3 Parts)</Label>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <Input
                  placeholder="First Name *"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <Input
                  placeholder="Middle Name"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                />
                <Input
                  placeholder="Last Name *"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email & User Code */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="edit-email" className="text-xs font-semibold">
                  User Email *
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-user-code" className="text-xs font-semibold">
                  User Code (4 Digits) *
                </Label>
                <Input
                  id="edit-user-code"
                  type="text"
                  maxLength={4}
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="font-mono font-bold text-center"
                  required
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-password" className="text-xs font-semibold">
                  User Password
                </Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-confirm-password" className="text-xs font-semibold">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="edit-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Match Indicator */}
            {isPasswordEntered && (
              <div className="flex items-center gap-1.5 text-xs">
                {isPasswordMatched ? (
                  <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                    <Check className="size-3.5" /> Passwords match!
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-medium text-destructive">
                    <AlertCircle className="size-3.5" /> Passwords do not match
                  </span>
                )}
              </div>
            )}

            {/* User Type Radio Buttons */}
            <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-3">
              <Label className="text-xs font-semibold">User Type *</Label>
              <RadioGroup
                value={userType}
                onValueChange={(val) => setUserType(val as UserType)}
                className="flex flex-wrap items-center gap-4 pt-1"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="admin" id="edit-type-admin" />
                  <Label htmlFor="edit-type-admin" className="cursor-pointer font-medium text-xs">
                    Admin
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="general" id="edit-type-general" />
                  <Label htmlFor="edit-type-general" className="cursor-pointer font-medium text-xs">
                    General User
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="guest" id="edit-type-guest" />
                  <Label htmlFor="edit-type-guest" className="cursor-pointer font-medium text-xs">
                    Guest
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* WhatsApp Number with Pre-built Country Code Dropdown */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">WhatsApp Number *</Label>
              <div className="flex items-center gap-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-44 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {COUNTRY_CODES.map((item) => (
                      <SelectItem key={item.code} value={item.code}>
                        <span className="flex items-center gap-2">
                          <span>{item.flag}</span>
                          <span className="font-mono font-semibold">{item.code}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  placeholder="771234567"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 font-mono"
                  required
                />
              </div>
            </div>

            {/* Department Dropdown */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Department *</Label>
              <Select value={department} onValueChange={(val) => setDepartment(val as Department)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_OPTIONS.map((dep) => (
                    <SelectItem key={dep} value={dep}>
                      {dep} Department
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Privileges Checkboxes */}
            <div className="space-y-2 rounded-lg border border-border/60 bg-card p-3">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-primary" /> User Privileges
              </Label>
              <div className="grid grid-cols-2 gap-2.5 pt-1 sm:grid-cols-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={privileges.billMaker}
                    onCheckedChange={() => togglePrivilege("billMaker")}
                  />
                  <span>Bill maker</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={privileges.grnMaker}
                    onCheckedChange={() => togglePrivilege("grnMaker")}
                  />
                  <span>GRN maker</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={privileges.userCreator}
                    onCheckedChange={() => togglePrivilege("userCreator")}
                  />
                  <span>User creator</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={privileges.billEditer}
                    onCheckedChange={() => togglePrivilege("billEditer")}
                  />
                  <span>Bill editer</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={privileges.adminPrivilege}
                    onCheckedChange={() => togglePrivilege("adminPrivilege")}
                  />
                  <span className="font-semibold text-primary">Admin privilege</span>
                </label>
              </div>
            </div>

            {/* Status & Lock Status */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-3">
                <Label className="text-xs font-semibold">Account Status</Label>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setStatus(status === "active" ? "inactive" : "active")}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      status === "active" ? "bg-emerald-600" : "bg-muted-foreground/30"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                        status === "active" ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                  <span className={cn("text-xs font-semibold capitalize", status === "active" ? "text-emerald-600" : "text-muted-foreground")}>
                    {status}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-3">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Lock className="size-3 text-amber-600" /> Account Lock
                </Label>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsLocked(!isLocked)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      isLocked ? "bg-amber-600" : "bg-muted-foreground/30"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                        isLocked ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                  <span className={cn("text-xs font-semibold", isLocked ? "text-amber-600" : "text-muted-foreground")}>
                    {isLocked ? "Locked" : "Unlocked"}
                  </span>
                </div>
              </div>
            </div>

            {/* Lock Reason if locked */}
            {isLocked && (
              <div className="space-y-1.5">
                <Label htmlFor="edit-lock-reason" className="text-xs font-semibold text-amber-600">
                  Reason for Locking Account *
                </Label>
                <Input
                  id="edit-lock-reason"
                  placeholder="Enter reason why account is locked..."
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  required={isLocked}
                />
              </div>
            )}

            {/* Remarks */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-user-remarks" className="text-xs font-semibold">
                User Remarks / Description
              </Label>
              <Textarea
                id="edit-user-remarks"
                rows={2}
                placeholder="Add brief description or notes about this user..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            {/* Submit Footer Actions */}
            <div className="-mx-6 -mb-6 mt-4 flex items-center justify-end gap-2 rounded-b-xl border-t bg-muted/50 p-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPasswordEntered && !isPasswordMatched}>
                Save Changes
              </Button>
            </div>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export default EditSelectedUser
