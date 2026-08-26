// User Management Data & Type Definitions

export type UserType = "admin" | "general" | "guest"
export type UserStatus = "active" | "inactive"
export type Department = "Finance" | "HR" | "General" | "Technical" | "Operations" | "Sales"

export interface UserPrivileges {
  billMaker: boolean
  grnMaker: boolean
  userCreator: boolean
  billEditer: boolean
  adminPrivilege: boolean
}

export interface UserRecord {
  userId: string
  userCode: string // 4-digit numeric code (e.g., "1001")
  firstName: string
  middleName: string
  lastName: string
  email: string
  password?: string
  countryCode: string // e.g., "+94"
  whatsappNumber: string
  userType: UserType
  department: Department
  privileges: UserPrivileges
  status: UserStatus
  isLocked: boolean
  lockReason: string
  remarks: string
}

export interface CountryCodeOption {
  code: string
  country: string
  flag: string
}

// Available international country codes with +94 Sri Lanka as default
export const COUNTRY_CODES: CountryCodeOption[] = [
  { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
  { code: "+1", country: "United States / Canada", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+90", country: "Turkey", flag: "🇹🇷" },
]

export const DEPARTMENT_OPTIONS: Department[] = [
  "Finance",
  "HR",
  "General",
  "Technical",
  "Operations",
  "Sales",
]

export const DEFAULT_PRIVILEGES: UserPrivileges = {
  billMaker: true,
  grnMaker: false,
  userCreator: false,
  billEditer: false,
  adminPrivilege: false,
}

export const ADMIN_PRIVILEGES: UserPrivileges = {
  billMaker: true,
  grnMaker: true,
  userCreator: true,
  billEditer: true,
  adminPrivilege: true,
}

/** Helper function to get full display name */
export function getUserFullName(user: UserRecord): string {
  const parts = [user.firstName, user.middleName, user.lastName].filter(Boolean)
  return parts.join(" ")
}

// Seed mock user dataset
export const INITIAL_USERS: UserRecord[] = [
  {
    userId: "USR-1001",
    userCode: "1001",
    firstName: "Nishan",
    middleName: "Dammika",
    lastName: "Perera",
    email: "nishan.d@ncn.lk",
    password: "Password@123",
    countryCode: "+94",
    whatsappNumber: "771234567",
    userType: "admin",
    department: "Technical",
    privileges: { ...ADMIN_PRIVILEGES },
    status: "active",
    isLocked: false,
    lockReason: "",
    remarks: "Senior System Administrator with full system control.",
  },
  {
    userId: "USR-1002",
    userCode: "1002",
    firstName: "Lashini",
    middleName: "Anuththara",
    lastName: "Silva",
    email: "lashini.s@ncn.lk",
    password: "Password@123",
    countryCode: "+94",
    whatsappNumber: "719876543",
    userType: "general",
    department: "Finance",
    privileges: {
      billMaker: true,
      grnMaker: true,
      userCreator: false,
      billEditer: true,
      adminPrivilege: false,
    },
    status: "active",
    isLocked: false,
    lockReason: "",
    remarks: "Accounts Executive responsible for invoicing and billing.",
  },
  {
    userId: "USR-1003",
    userCode: "1003",
    firstName: "Hashini",
    middleName: "Dilhara",
    lastName: "Fernando",
    email: "hashini.f@ncn.lk",
    password: "Password@123",
    countryCode: "+94",
    whatsappNumber: "754567890",
    userType: "general",
    department: "Operations",
    privileges: {
      billMaker: true,
      grnMaker: true,
      userCreator: false,
      billEditer: false,
      adminPrivilege: false,
    },
    status: "active",
    isLocked: false,
    lockReason: "",
    remarks: "Warehouse and stock operations lead.",
  },
  {
    userId: "USR-1004",
    userCode: "1004",
    firstName: "Nilanga",
    middleName: "Pradeep",
    lastName: "Jayasinghe",
    email: "nilanga.j@ncn.lk",
    password: "Password@123",
    countryCode: "+94",
    whatsappNumber: "761122334",
    userType: "general",
    department: "HR",
    privileges: {
      billMaker: false,
      grnMaker: false,
      userCreator: true,
      billEditer: false,
      adminPrivilege: false,
    },
    status: "active",
    isLocked: false,
    lockReason: "",
    remarks: "Human Resources Specialist.",
  },
  {
    userId: "USR-1005",
    userCode: "1005",
    firstName: "Kasun",
    middleName: "Chinthaka",
    lastName: "Weerasinghe",
    email: "kasun.w@ncn.lk",
    password: "Password@123",
    countryCode: "+94",
    whatsappNumber: "723344556",
    userType: "guest",
    department: "General",
    privileges: {
      billMaker: false,
      grnMaker: false,
      userCreator: false,
      billEditer: false,
      adminPrivilege: false,
    },
    status: "inactive",
    isLocked: true,
    lockReason: "Temporary contractor contract expired.",
    remarks: "External auditor guest access.",
  },
]
