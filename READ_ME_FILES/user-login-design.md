# User & Role-Based Access Module — System Design

## 1. The core idea: separate *who the user is* from *what the user can do*

A user's identity (name, contact info, department) and a user's permissions (what
screens/actions they can touch) are two different concerns that change at different
rates and are edited by different people (HR edits identity, an admin edits
permissions). So we split them into two layers, connected by reference — the same
"don't fuse related-but-separate things into one document" principle used for
`SalesInvoice` vs `SalesIssue` in the stock/AR modules:

> **`User` holds identity + org placement. `Role` holds a bundle of `Privilege`s.
> A user is assigned one (or more) roles, and can optionally get individual
> privilege overrides on top.** Effective access = role privileges ± user-level
> overrides, resolved at login/request time — never hand-copied onto the user
> document, so a role change instantly applies to everyone holding that role.

This keeps the module reconcilable later: "why can this user see the Payroll
screen?" always has one answer path — trace their role(s), then check overrides.

---

## 2. Collections

### 2.1 `Department` and `Section` — org structure (referenced by `User`)

```js
const DepartmentSchema = new Schema({
  departmentCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  head: { type: Schema.Types.ObjectId, ref: "User" },   // department head, set after users exist
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const SectionSchema = new Schema({
  sectionCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  department: { type: Schema.Types.ObjectId, ref: "Department", required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
```

Keeping these as their own collections (rather than free-text fields on `User`)
is what makes org charts, department-wise reporting, and "everyone under this
supervisor" queries possible later without a data-cleanup project.

### 2.2 `Privilege` — the smallest unit of permission

```js
const PrivilegeSchema = new Schema({
  privilegeCode: { type: String, required: true, unique: true }, // e.g. "INVOICE_CREATE"
  name: { type: String, required: true },                        // e.g. "Create Sales Invoice"
  module: { type: String, required: true },                      // e.g. "AR", "STOCK", "USER_ADMIN"
  description: String,
}, { timestamps: true });
```

Think of these as the fixed, developer-defined vocabulary of "things the system
can check permission for" — new features add new privilege codes; they are not
something end users create through the UI.

### 2.3 `Role` — a named bundle of privileges

```js
const RoleSchema = new Schema({
  roleCode: { type: String, required: true, unique: true },   // e.g. "ACCOUNTS_CLERK"
  name: { type: String, required: true },
  description: String,
  privileges: [{ type: Schema.Types.ObjectId, ref: "Privilege" }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
```

### 2.4 `User` — identity + org placement + role assignment

```js
const UserSchema = new Schema({
  userCode: { type: String, required: true, unique: true },     // human-readable ID, e.g. "EMP-0042"

  firstName: { type: String, required: true },
  middleName: String,                                            // "Second Name"
  lastName: { type: String, required: true },

  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  whatsappNumber: { type: String, required: true },
  phone: String,

  passwordHash: { type: String, required: true, select: false }, // never return by default
  passwordChangedAt: Date,
  mustChangePassword: { type: Boolean, default: true },           // force reset on first login

  roles: [{ type: Schema.Types.ObjectId, ref: "Role", required: true }],
  privilegeOverrides: [{
    privilege: { type: Schema.Types.ObjectId, ref: "Privilege", required: true },
    effect: { type: String, enum: ["GRANT", "DENY"], required: true } // DENY wins over any role grant
  }],

  department: { type: Schema.Types.ObjectId, ref: "Department", required: true },
  section: { type: Schema.Types.ObjectId, ref: "Section" },
  supervisor: { type: Schema.Types.ObjectId, ref: "User" },        // self-reference for reporting line
  designation: String,                                             // job title, e.g. "Accounts Executive"

  isActive: { type: Boolean, default: true },
  isLocked: { type: Boolean, default: false },
  lockReason: String,
  lastLoginAt: Date,
  failedLoginAttempts: { type: Number, default: 0 },

  createdBy: { type: Schema.Types.ObjectId, ref: "User" },

}, { timestamps: true });

UserSchema.index({ department: 1, section: 1 });
UserSchema.index({ supervisor: 1 });
```

Notes on a couple of fields worth calling out:

- **`userCode` vs `_id`** — the "user ID" in your requirements is best split into
  two things: MongoDB's own `_id` (system/internal, used in all references above)
  and `userCode` (a human-readable, business-facing code like `EMP-0042` that
  appears on printouts, approvals, "created by" tags, etc.). Don't try to make
  the Mongo `_id` itself human-readable — let the database do its job and give
  people a friendly code instead.
- **`passwordHash` with `select: false`** — password data should never come back
  on a normal `User.find()`; it has to be explicitly requested by the login
  service only.
- **`privilegeOverrides` with GRANT/DENY** — covers the two real-world cases:
  "this one clerk also needs invoice-approval rights beyond their role" (GRANT),
  and "this one user should NOT have a privilege their role normally includes"
  (DENY, e.g. someone under investigation). DENY always wins in resolution.

### 2.5 `UserLoginLog` — audit trail (mirrors the ledger pattern's "immutable history" idea)

```js
const UserLoginLogSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  eventType: {
    type: String,
    enum: ["LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT", "PASSWORD_RESET", "ACCOUNT_LOCKED"],
    required: true
  },
  ipAddress: String,
  userAgent: String,
  remarks: String,
  eventAt: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

UserLoginLogSchema.index({ user: 1, eventAt: -1 });
```

Same reasoning as `CustomerLedgerEntry` in the AR module: identity/security
events should be an **append-only log**, not a mutable field like
`user.lastLoginAt` alone — you need the full history for security review
("who logged in from where, and when did the failed attempts start").
`lastLoginAt`/`failedLoginAttempts` on `User` remain as fast-read denormalized
fields, kept in sync by whichever service writes the log — the same
cache-plus-immutable-history shape as `CustomerBalanceSummary` next to
`CustomerLedgerEntry`.

---

## 3. Resolving "what can this user do" — the effective-privilege check

```js
async function getEffectivePrivileges(userId) {
  const user = await User.findById(userId).populate({ path: "roles", populate: "privileges" });

  const granted = new Set();
  for (const role of user.roles) {
    for (const p of role.privileges) granted.add(String(p._id));
  }

  for (const override of user.privilegeOverrides) {
    if (override.effect === "GRANT") granted.add(String(override.privilege));
    if (override.effect === "DENY") granted.delete(String(override.privilege));
  }

  return granted; // Set of privilege ObjectIds — check against this on each protected action
}
```

Cache this per-request (or in the JWT/session on login) rather than re-querying
on every action — but always rebuild it fresh on login, and whenever a role or
override changes, so stale permissions don't linger in an active session.

---

## 4. Login flow

1. User submits `email` + `password`.
2. Look up `User` by email, explicitly `.select("+passwordHash")`.
3. If `isLocked` → reject, write `ACCOUNT_LOCKED`-adjacent `LOGIN_FAILED` log entry.
4. If `!isActive` → reject (deactivated staff shouldn't authenticate at all).
5. Compare password hash (bcrypt/argon2). On mismatch:
   - increment `failedLoginAttempts`
   - write `LOGIN_FAILED` to `UserLoginLog`
   - if attempts cross a threshold (e.g. 5), set `isLocked = true`, write `ACCOUNT_LOCKED`
6. On success:
   - reset `failedLoginAttempts` to 0
   - set `lastLoginAt = now`
   - write `LOGIN_SUCCESS` to `UserLoginLog`
   - resolve effective privileges (§3), issue session/JWT carrying `userId`, `roles`, and the resolved privilege set
   - if `mustChangePassword` is true, force the password-reset screen before anything else

---

## 5. Single writer principle (same rule as stock and AR)

Introduce **one `userAccessService`** that is the only code path allowed to
write `UserLoginLog` entries, flip `isLocked`, or mutate `roles`/
`privilegeOverrides`. Screens for "assign role," "lock account," "reset
password," and the login endpoint itself all call into it, rather than each
writing directly to `User`. This is the same discipline as
`customerLedgerService` in the AR module — one throat to choke when someone
asks "why does this user suddenly have/lack this permission."

```
/models
  /users
    User.js
    Role.js
    Privilege.js
    Department.js
    Section.js
    UserLoginLog.js

/services
  userAccessService.js   // sole writer to login log, lock state, role/override changes
  authService.js          // login, password hashing/verification, session issuance
  privilegeResolver.js    // getEffectivePrivileges()
```

---

## 6. Suggested build order

1. `Department` + `Section` — org structure needs to exist before users reference it.
2. `Privilege` — seed the fixed list of system-defined permission codes.
3. `Role` — bundle privileges into named roles (e.g. Admin, Accounts Clerk, Sales Rep).
4. `User` — identity, org placement, role assignment; get creation/edit screens working with no login yet.
5. `authService` — password hashing, login endpoint, session/JWT issuance.
6. `UserLoginLog` + lockout logic — build alongside login, not bolted on later (same lesson as advance/overpayment handling in the AR module — security/audit trails are easy to get wrong if added after the fact).
7. `privilegeResolver` + route/action guards across the rest of the ERP — this is what makes every other module (stock, AR, etc.) actually permission-aware.
8. Supervisor hierarchy reports, department/section org-chart views, admin screens for role & override management.

Because this reuses the same "immutable audit log + fast-read denormalized
cache + single writer service" shape as the stock and AR modules, this module
should feel familiar to build even though it's solving a different problem —
identity and access instead of inventory or money.