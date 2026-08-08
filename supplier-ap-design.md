# Supplier & Accounts Payable (AP) Module — System Design

## 1. The core idea: same ledger pattern, mirrored direction

This module is the mirror image of the Customer/AR module you already have. Instead of tracking what customers owe *you*, you're tracking what *you* owe suppliers. Same architecture applies:

> Every Purchase Order receipt (bill), payment, debit note, and cheque bounce writes an immutable entry to a `SupplierLedgerEntry` collection. Current outstanding payable = `SUM(bills) - SUM(payments) - SUM(debit notes)`, cached in `SupplierBalanceSummary`.

The one-writer rule applies again: a single `supplierLedgerService` is the only code path allowed to touch `SupplierLedgerEntry` / `SupplierBalanceSummary`.

Where it differs meaningfully from AR — and where it's worth slowing down — is: **(a)** the liability is created from a *goods receipt* (GRN), not created standalone like a sales invoice; **(b)** cheques here are ones *you issue*, with a different risk profile (post-dated cheques, your own bounce penalties); **(c)** debit notes are *your* document, issued to the supplier when you return goods.

---

## 2. Collections

### 2.1 `Supplier` — master data

```js
const SupplierSchema = new Schema({
  supplierCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  contactPerson: String,
  phone: String,
  email: String,
  address: String,
  taxId: String,

  paymentTerms: { type: Number, default: 0 },   // credit days supplier gives you, e.g. "Net 30"
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    branch: String
  },

  isActive: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },   // e.g. blocked from new POs due to quality issues or dispute
  blockReason: String,

}, { timestamps: true });
```

### 2.2 `PurchaseOrder` — you already have this from the stock design

No change needed to the schema from the earlier design — it already references `Supplier`. Worth restating here because it's the entry point of the whole AP flow: **PO → GRN → Supplier Bill → Payment**, and PO status (`DRAFT → APPROVED → PARTIALLY_RECEIVED → RECEIVED → CLOSED`) is what your procurement team tracks day to day.

### 2.3 `SupplierBill` — the liability-creating document

This is the AP equivalent of `SalesInvoice`. It's normally generated *from* a posted GRN (the supplier's invoice arrives and gets matched against what you actually received), not created freely — that's the "3-way match" (PO / GRN / Invoice) that prevents paying for things you never ordered or received.

```js
const SupplierBillSchema = new Schema({
  billNumber: { type: String, required: true, unique: true },     // your internal reference
  supplierInvoiceNumber: { type: String, required: true },        // the number on the supplier's actual invoice
  supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },

  purchaseOrder: { type: Schema.Types.ObjectId, ref: "PurchaseOrder" },
  grn: { type: Schema.Types.ObjectId, ref: "GRN" },

  billDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },   // billDate + supplier.paymentTerms

  items: [{
    item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    quantity: Number,
    rate: Number,
    taxAmount: { type: Number, default: 0 },
    lineTotal: Number
  }],

  subTotal: Number,
  totalTax: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },

  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },

  matchStatus: {
    type: String,
    enum: ["MATCHED", "PRICE_VARIANCE", "QTY_VARIANCE", "UNMATCHED"],
    default: "UNMATCHED"
  },   // flags discrepancy between PO rate/qty and the bill — worth surfacing for approval, not silently accepting

  status: { type: String, enum: ["DRAFT", "APPROVED", "PARTIALLY_PAID", "PAID", "OVERDUE", "DISPUTED", "CANCELLED"], default: "DRAFT" },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  remarks: String,

}, { timestamps: true });

SupplierBillSchema.index({ supplier: 1, status: 1 });
SupplierBillSchema.index({ dueDate: 1, status: 1 });
```

**Matching logic (service function, at bill creation):** compare `SupplierBill` line rates/quantities against the linked `PurchaseOrder` and `GRN` accepted quantities. If they line up within tolerance → `matchStatus: "MATCHED"` and it can auto-approve. If not → flag for manual approval before it's allowed to post to the ledger. This is the single biggest control point in AP — it's where "we paid for 100 units but only received 90" gets caught.

### 2.4 `SupplierLedgerEntry` — the immutable AP ledger

```js
const SupplierLedgerEntrySchema = new Schema({
  supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },

  entryType: {
    type: String,
    enum: [
      "BILL",              // increases what you owe
      "PAYMENT",           // decreases what you owe
      "DEBIT_NOTE",        // decreases what you owe (goods returned to supplier)
      "CREDIT_NOTE_RECEIVED", // decreases what you owe (supplier's own goodwill/correction credit to you)
      "CHEQUE_BOUNCE",     // reverses a payment you made that bounced — increases what you owe again
      "ADVANCE_PAID",      // you paid supplier before a bill existed — decreases what you owe once allocated
      "ADVANCE_ALLOCATED", // applies an existing advance against a new bill
      "REFUND_RECEIVED"    // supplier refunds you cash from an advance/credit balance
    ],
    required: true
  },

  direction: { type: String, enum: ["DEBIT", "CREDIT"], required: true },
  // Convention: DEBIT increases payable (bills, cheque bounces); CREDIT decreases payable (payments, debit notes, advances)
  amount: { type: Number, required: true },

  refDocType: String,   // "SupplierBill", "SupplierPayment", "DebitNote", "Cheque"
  refDocId: { type: Schema.Types.ObjectId },
  refDocNumber: String,

  balanceAfter: Number,
  remarks: String,
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  transactionDate: { type: Date, required: true, default: Date.now },

}, { timestamps: true });

SupplierLedgerEntrySchema.index({ supplier: 1, transactionDate: 1 });
```

### 2.5 `SupplierBalanceSummary`

```js
const SupplierBalanceSummarySchema = new Schema({
  supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true, unique: true },
  totalPayable: { type: Number, default: 0 },
  advanceBalance: { type: Number, default: 0 },   // money you've paid ahead of a bill
  netPosition: { type: Number, default: 0 },      // totalPayable - advanceBalance
  lastTransactionDate: Date
}, { timestamps: true });
```

Rebuildable from the ledger, exactly like the customer version.

---

## 3. Supplier Payments — with allocation

Structurally identical to `CustomerPayment`, just outgoing instead of incoming.

```js
const SupplierPaymentSchema = new Schema({
  paymentNumber: { type: String, required: true, unique: true },
  supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
  paymentDate: { type: Date, required: true, default: Date.now },

  paymentMethod: { type: String, enum: ["CASH", "CHEQUE", "BANK_TRANSFER", "ONLINE"], required: true },
  totalAmount: { type: Number, required: true },

  chequeRef: { type: Schema.Types.ObjectId, ref: "Cheque" },

  allocations: [{
    bill: { type: Schema.Types.ObjectId, ref: "SupplierBill", required: true },
    allocatedAmount: { type: Number, required: true }
  }],

  unallocatedAmount: { type: Number, default: 0 },   // becomes an ADVANCE_PAID entry — you paid ahead of a bill

  status: { type: String, enum: ["PENDING", "CONFIRMED", "REVERSED"], default: "CONFIRMED" },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },  // outgoing payments almost always need approval
  remarks: String,

}, { timestamps: true });
```

Allocation runs the same way as AR: oldest-bill-first by default, manual override supported, leftover becomes an advance to the supplier rather than sitting orphaned.

**One AP-specific practical addition: approval workflow matters more here than on the AR side.** Recording a customer payment is low-risk (money already arrived); *authorizing* an outgoing payment is where fraud/error controls matter. Add an `approvalStatus` + `approvedBy` gate before a `SupplierPayment` is allowed to post to the ledger — typically a maker-checker pattern (one person creates, another approves) once you're past the prototype stage.

---

## 4. Cheques — issued, not received (different lifecycle)

This is the real asymmetry with the AR module. On the customer side, a cheque *arrives* and might bounce against you. On the supplier side, **you write the cheque**, and:

- It might be **post-dated** (very common in supplier payment terms — "cheque dated 30 days from now").
- Its lifecycle is about tracking your own outstanding liability until it's actually presented and cleared by the bank — you need to know which issued cheques haven't cleared yet for cash-flow planning.
- If it bounces, the consequence is on **you** (bank charges, supplier relationship damage), not the other way around.

```js
const ChequeSchema = new Schema({
  chequeNumber: { type: String, required: true },
  ourBankAccount: { type: Schema.Types.ObjectId, ref: "BankAccount", required: true },  // which of your accounts it's drawn on

  chequeDate: { type: Date, required: true },   // may be post-dated
  isPostDated: { type: Boolean, default: false },

  amount: { type: Number, required: true },
  supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
  payment: { type: Schema.Types.ObjectId, ref: "SupplierPayment", required: true },

  status: {
    type: String,
    enum: ["ISSUED", "HANDED_OVER", "PRESENTED", "CLEARED", "BOUNCED", "CANCELLED"],
    default: "ISSUED"
  },
  presentedDate: Date,
  clearedDate: Date,
  bounceReason: String,
  bounceCharges: { type: Number, default: 0 },

}, { timestamps: true });

ChequeSchema.index({ chequeNumber: 1, ourBankAccount: 1 });
```

**Practical flow for post-dated cheques:** many businesses want to see "cheques issued but not yet presented" as a distinct cash-flow report — money that's committed but hasn't actually left the bank account yet. Query `Cheque.find({ status: { $in: ["ISSUED","HANDED_OVER"] } })` grouped by expected clearing date to get a forward cash-flow view. This is genuinely useful for treasury/cash planning and worth building even if nothing else about cheques is fancy.

**Bounce handling (mirrors AR, reversed):**
1. `Cheque.status = "BOUNCED"`.
2. Reverse the allocations on the linked `SupplierPayment` — decrement `SupplierBill.paidAmount` back up, recompute status.
3. Write a `SupplierLedgerEntry` (`entryType: "CHEQUE_BOUNCE"`, `direction: "DEBIT"`) — you owe the supplier again.
4. Record `bounceCharges` as a separate ledger debit if your bank charged you (informational — doesn't affect what you owe the *supplier*, but worth tracking against the bank account/expense side of your books).
5. `SupplierPayment.status = "REVERSED"`.

---

## 5. Debit Notes — for returned items

This is your AP equivalent of the customer module's credit note, and it's the natural companion to the `PURCHASE_RETURN` stock movement you already defined in the stock design. When you send goods back to a supplier — defective, wrong item, over-delivery — you issue a debit note reducing what you owe them.

```js
const DebitNoteSchema = new Schema({
  debitNoteNumber: { type: String, required: true, unique: true },
  supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },

  reason: {
    type: String,
    enum: ["DEFECTIVE_GOODS", "WRONG_ITEM", "OVER_DELIVERY", "PRICE_CORRECTION", "OTHER"],
    required: true
  },

  linkedBill: { type: Schema.Types.ObjectId, ref: "SupplierBill" },       // usually issued against a specific bill
  linkedGRN: { type: Schema.Types.ObjectId, ref: "GRN" },
  linkedStockMovement: { type: Schema.Types.ObjectId, ref: "StockLedgerEntry" }, // the PURCHASE_RETURN entry

  items: [{
    item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    quantity: Number,
    rate: Number,
    amount: Number
  }],

  totalAmount: { type: Number, required: true },
  allocations: [{
    bill: { type: Schema.Types.ObjectId, ref: "SupplierBill", required: true },
    allocatedAmount: { type: Number, required: true }
  }],
  unallocatedAmount: { type: Number, default: 0 },  // if it exceeds the bill it's issued against, becomes a supplier advance in your favor

  status: { type: String, enum: ["DRAFT", "POSTED", "CANCELLED"], default: "DRAFT" },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  remarks: String,

}, { timestamps: true });
```

**Practical sequencing for a return:**
1. Warehouse creates the physical return → posts a `StockLedgerEntry` with `transactionType: "PURCHASE_RETURN"`, `direction: "OUT"` (stock leaves your warehouse, going back to supplier).
2. Accounts creates the `DebitNote` referencing that stock movement and the original `GRN`/`SupplierBill`.
3. Posting the debit note writes a `SupplierLedgerEntry` (`entryType: "DEBIT_NOTE"`, `direction: "CREDIT"`, i.e. reduces payable), and its `allocations[]` reduces `SupplierBill.balanceAmount` on the specific bill(s) it targets.

Keeping the debit note as its own document (rather than editing the original `SupplierBill`) preserves the original bill as an accurate historical record of what the supplier actually invoiced — the correction is a separate, auditable event layered on top.

---

## 6. Supplier Outstandings & Aging — a query, same as AR

```js
SupplierBill.aggregate([
  { $match: { status: { $in: ["APPROVED", "PARTIALLY_PAID", "OVERDUE"] } } },
  { $addFields: {
      daysOverdue: { $divide: [{ $subtract: [new Date(), "$dueDate"] }, 1000*60*60*24] }
  }},
  { $group: {
      _id: "$supplier",
      totalPayable: { $sum: "$balanceAmount" },
      bills: { $push: { billNumber: "$billNumber", balanceAmount: "$balanceAmount", daysOverdue: "$daysOverdue" } }
  }}
])
```

Pair this with the "cheques issued but not yet presented" query from §4 for a genuinely useful **cash-flow forecast**: what you owe now (`totalPayable`) plus what's already committed via post-dated cheques, bucketed by date.

---

## 7. Folder structure

```
/models
  /suppliers
    Supplier.js
    SupplierBill.js
    SupplierPayment.js
    Cheque.js            // shared collection name is fine even though customer cheques are a separate schema/collection — keep them distinct: SupplierCheque vs CustomerCheque, or a `direction: ISSUED|RECEIVED` field on one shared model if you'd rather not duplicate
    DebitNote.js
    SupplierLedgerEntry.js
    SupplierBalanceSummary.js

/services
  supplierLedgerService.js   // sole writer to ledger + summary
  billService.js             // 3-way match logic (PO/GRN/Bill)
  supplierPaymentService.js  // allocation + advance handling + approval gate
  supplierChequeService.js   // issued-cheque lifecycle, bounce reversal
  debitNoteService.js        // ties to stock's PURCHASE_RETURN movement
  apAgingReportService.js
```

On the cheque-model-naming note above: since customer cheques and supplier cheques have genuinely different lifecycles (`RECEIVED→CLEARED/BOUNCED` vs `ISSUED→PRESENTED→CLEARED/BOUNCED`) and different risk implications, keep them as **two separate schemas/collections** (`CustomerCheque`, `SupplierCheque`) rather than forcing one shared model with a direction flag — it'll read more clearly six months from now than a single overloaded collection with half its fields meaningless depending on direction.

---

## 8. Suggested build order

1. `Supplier` master (you likely already have the shell of this from the PO work in the stock module).
2. `SupplierBill` generated from posted `GRN` + 3-way match against `PurchaseOrder` — get this solid before touching payments.
3. `SupplierLedgerEntry` + `SupplierBalanceSummary` + `supplierLedgerService`.
4. `SupplierPayment` with allocation + approval gate.
5. Advance-to-supplier handling (overpayment in your favor) — same pattern as the customer module's advance, mirrored.
6. `SupplierCheque` issued-cheque lifecycle + post-dated cheque tracking + bounce reversal.
7. `DebitNote`, linked to `PURCHASE_RETURN` stock movements.
8. AP aging report + cash-flow forecast combining outstanding bills and un-presented cheques.

At this point you'll have three modules — Stock, AR, AP — all built on the identical ledger + summary + single-writer-service pattern. That consistency is the real payoff: once a developer understands one, they understand all three, and any auditor/accountant reviewing the system can trust that "outstanding balance" always means the same thing everywhere.
