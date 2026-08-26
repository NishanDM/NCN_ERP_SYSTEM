import { useState, useMemo } from "react"
import {
  Search,
  UserPlus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Users,
  ShieldCheck,
  UserCheck,
  Lock,
  RefreshCw,
  X,
  FileText,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

import {
  INITIAL_USERS,
  DEPARTMENT_OPTIONS,
  getUserFullName,
  type UserRecord,
  type UserType,
  type Department,
} from "./usersData"

import CreateNewUser from "./CreateNewUser"
import ViewSelectedUser from "./ViewSelectedUser"
import EditSelectedUser from "./EditSelectedUser"
import DeleteUserModal from "./DeleteUserModal"

const ALL_FILTER = "all"

function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS)

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>(ALL_FILTER)
  const [userTypeFilter, setUserTypeFilter] = useState<string>(ALL_FILTER)

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // Calculate summary stats
  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter((u) => u.status === "active").length
    const locked = users.filter((u) => u.isLocked).length
    const admins = users.filter((u) => u.userType === "admin").length
    return { total, active, locked, admins }
  }, [users])

  // Filter users list based on search and selected filters
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return users.filter((user) => {
      const fullName = getUserFullName(user).toLowerCase()
      const matchesQuery =
        !query ||
        user.userId.toLowerCase().includes(query) ||
        user.userCode.toLowerCase().includes(query) ||
        fullName.includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.whatsappNumber.includes(query) ||
        user.department.toLowerCase().includes(query)

      const matchesDepartment =
        departmentFilter === ALL_FILTER || user.department === departmentFilter
      const matchesType =
        userTypeFilter === ALL_FILTER || user.userType === userTypeFilter

      return matchesQuery && matchesDepartment && matchesType
    })
  }, [users, searchQuery, departmentFilter, userTypeFilter])

  // Handlers for user state updates
  const handleUserCreated = (newUser: UserRecord) => {
    setUsers((prev) => [newUser, ...prev])
  }

  const handleUserUpdated = (updatedUser: UserRecord) => {
    setUsers((prev) =>
      prev.map((u) => (u.userId === updatedUser.userId ? updatedUser : u))
    )
  }

  const handleConfirmDelete = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.userId !== userId))
  }

  const handleRefresh = () => {
    setSearchQuery("")
    setDepartmentFilter(ALL_FILTER)
    setUserTypeFilter(ALL_FILTER)
    toast("User list refreshed")
  }

  return (
    <div className="w-full px-6 pb-6 lg:px-8 lg:pt-4 lg:pb-8 space-y-6">
      {/* Page Header */}
      <div className="-mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-foreground">User Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage system users, credentials, roles, department assignments, and privileges
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-xs font-medium text-primary flex items-center gap-1.5">
            <Users className="size-3.5" /> Total System Users
          </p>
          <p className="mt-1 text-2xl font-bold text-primary">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <UserCheck className="size-3.5" /> Active Users
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {stats.active}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <Lock className="size-3.5" /> Locked Accounts
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">
            {stats.locked}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-primary" /> Administrators
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.admins}</p>
        </div>
      </div>

      {/* Main Toolbar: Search Bar + Department/Type Filters + Create New User Primary Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input field */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by User ID, User Code, Name, Email, WhatsApp or Department..."
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              title="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Filter dropdowns & buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-40 min-w-0">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>All Departments</SelectItem>
              {DEPARTMENT_OPTIONS.map((dep) => (
                <SelectItem key={dep} value={dep}>
                  {dep}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* User Type Filter */}
          <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
            <SelectTrigger className="w-36 min-w-0">
              <SelectValue placeholder="User Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>All Types</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="guest">Guest</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh button */}
          <Button type="button" variant="outline" size="icon" onClick={handleRefresh} title="Refresh Users">
            <RefreshCw className="size-4" />
          </Button>

          {/* Create New User Primary Button */}
          <Button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="gap-2 shadow-xs"
          >
            <UserPlus className="size-4" />
            Create New User
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 text-xs">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead className="w-28">User ID</TableHead>
              <TableHead>User Name</TableHead>
              <TableHead className="w-24 text-center">User Code</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-36">WhatsApp Num</TableHead>
              <TableHead className="w-28">Department</TableHead>
              <TableHead className="w-28 text-center">User Type</TableHead>
              <TableHead className="w-24 text-center">Status</TableHead>
              <TableHead className="w-24 text-center">Lock Status</TableHead>
              <TableHead className="w-16 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                  <Users className="mx-auto mb-2 size-8 opacity-30" />
                  <p className="text-sm font-medium">No users found matching "{searchQuery}"</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user, index) => {
                const fullName = getUserFullName(user)

                return (
                  <TableRow key={user.userId} className="text-xs">
                    <TableCell className="text-center font-mono text-muted-foreground">
                      {index + 1}
                    </TableCell>

                    <TableCell className="font-mono font-semibold text-primary">
                      {user.userId}
                    </TableCell>

                    <TableCell className="font-semibold text-foreground">
                      {fullName}
                    </TableCell>

                    <TableCell className="text-center font-mono font-bold">
                      <Badge variant="outline" className="font-mono text-xs">
                        {user.userCode}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>

                    <TableCell className="font-mono text-foreground">
                      {user.countryCode} {user.whatsappNumber}
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {user.department}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant={user.userType === "admin" ? "default" : "outline"}
                        className={cn(
                          "capitalize text-[10px]",
                          user.userType === "admin" && "bg-primary text-primary-foreground",
                          user.userType === "general" && "bg-secondary text-secondary-foreground",
                          user.userType === "guest" && "bg-muted text-muted-foreground"
                        )}
                      >
                        {user.userType}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
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
                    </TableCell>

                    <TableCell className="text-center">
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
                    </TableCell>

                    {/* 3-dots Actions Menu */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={(props) => (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="size-7"
                              {...props}
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          )}
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user)
                              setViewModalOpen(true)
                            }}
                          >
                            <Eye className="mr-2 size-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user)
                              setEditModalOpen(true)
                            }}
                          >
                            <Edit className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              toast(`User Details for ${user.userId}`, {
                                description: `Department: ${user.department} | Type: ${user.userType}`,
                              })
                            }}
                          >
                            <FileText className="mr-2 size-4" />
                            More Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              setSelectedUser(user)
                              setDeleteModalOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Components */}
      <CreateNewUser
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onUserCreated={handleUserCreated}
      />

      <ViewSelectedUser
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        user={selectedUser}
      />

      <EditSelectedUser
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
      />

      <DeleteUserModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        user={selectedUser}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  )
}

export default UserManagement
