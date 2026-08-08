# Customer & Accounts Receivable (AR) Module — System Design

## 1. The core idea: reuse the ledger pattern, this time for money

Everything you listed — invoices, payments, outstandings, credit notes, cheques, overpayments — is really **one problem**: tracking a running balance of what each customer owes you, with full audit history. This is *exactly* the same shape of problem as stock quantity, so we reuse the same architecture:

> **Never store `customer.outstandingBalance` as a mutable field.** Every invoice, payment, credit note, and cheque bounce writes an immutable entry to a `CustomerLedgerEntry` collection. Current outstanding = `SUM(debits) - SUM(credits)`, cached in a `CustomerBalanceSummary` for fast reads.

Debits increase what the customer owes (invoices). Credits decrease it (payments, credit notes). This is standard double-entry logic, simplified to a single-party ledger.

---

## 2. Collections

### 2.1 `Customer` — master data

```js
const CustomerSchema = new Schema({
  customerCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ["INDIVIDUAL", "COMPANY"], default: "COMPANY" },
  contactPerson: String,
  phone: String,
  email: String,
  billingAddress: String,
  shippingAddress: String,
  taxId: String,                     // VAT/TIN number etc.

  creditLimit: { type: Number, default: 0 },
  creditDays: { type: Number, default: 0 },   // payment terms, e.g. 30 days
  priceList: { type: Schema.Types.ObjectId, ref: "PriceList" }, // optional, if you have tiered pricing

  isActive: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },  // block new invoices if overdue/over credit limit
  blockReason: String,

}, { timestamps: true });
```

### 2.2 `SalesInvoice`

```js
const SalesInvoiceSchema = new Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  invoiceDate: { type: Date, required: true, default: Date.now },
  dueDate: { type: Date, required: true },   // invoiceDate + customer.creditDays

  items: [{
    item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true }
  }],

  subTotal: Number,
  totalDiscount: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },

  paidAmount: { type: Number, default: 0 },       // denormalized running total — kept in sync by allocation logic
  balanceAmount: { type: Number, default: 0 },    // grandTotal - paidAmount

  status: {
    type: String,
    enum: ["DRAFT", "POSTED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"],
    default: "DRAFT"
  },

  linkedStockIssue: { type: Schema.Types.ObjectId, ref: "SalesIssue" }, // ties back to your stock module
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  remarks: String,

}, { timestamps: true });

SalesInvoiceSchema.index({ customer: 1, status: 1 });
SalesInvoiceSchema.index({ dueDate: 1, status: 1 }); // for overdue/aging queries
```

Note the `linkedStockIssue` reference — invoicing and stock-out are related but separate concerns. In a real business you might invoice before, during, or after delivery depending on your process; keep them as separate documents connected by reference, not fused into one.

### 2.3 `CustomerLedgerEntry` — the immutable AR ledger (the heart of this module)

```js
const CustomerLedgerEntrySchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },

  entryType: {
    type: String,
    enum: [
      "INVOICE",           // DEBIT — increases what customer owes
      "PAYMENT",           // CREDIT — customer paid
      "CREDIT_NOTE",       // CREDIT — reduces amount owed (return/discount/goodwill)
      "DEBIT_NOTE",        // DEBIT — increases amount owed (e.g. correction, late fee)
      "CHEQUE_BOUNCE",     // DEBIT — reverses a previously recorded payment
      "ADVANCE_RECEIVED",  // CREDIT — overpayment, unallocated
      "ADVANCE_ALLOCATED", // moves an advance's credit onto a specific invoice (net zero across the pair, see §5)
      "REFUND"             // DEBIT — cash refunded back to customer from their advance/credit balance
    ],
    required: true
  },

  direction: { type: String, enum: ["DEBIT", "CREDIT"], required: true },
  amount: { type: Number, required: true },  // always positive; direction gives sign

  refDocType: String,   // "SalesInvoice", "CustomerPayment", "CreditNote", "Cheque"
  refDocId: { type: Schema.Types.ObjectId },
  refDocNumber: String,

  balanceAfter: { type: Number },  // running balance snapshot for audit trail

  remarks: String,
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  transactionDate: { type: Date, required: true, default: Date.now },

}, { timestamps: true });

CustomerLedgerEntrySchema.index({ customer: 1, transactionDate: 1 });
```

### 2.4 `CustomerBalanceSummary` — fast-read cache

```js
const CustomerBalanceSummarySchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true, unique: true },
  totalOutstanding: { type: Number, default: 0 },     // sum of unpaid invoice balances
  advanceBalance: { type: Number, default: 0 },       // unallocated overpayment sitting as credit
  netPosition: { type: Number, default: 0 },          // totalOutstanding - advanceBalance (negative = customer is in credit)
  lastTransactionDate: Date
}, { timestamps: true });
```

Just like `StockSummary`, this is rebuildable at any time by re-aggregating `CustomerLedgerEntry` — your safety net if it ever drifts.

---

## 3. Customer Payments — with allocation

A payment is rarely "just a number." It has to be **allocated** against specific invoices (so you know exactly which invoice(s) it settles), and it might be split across multiple payment methods (part cash, part cheque).

### 3.1 `CustomerPayment` (header)

```js
const CustomerPaymentSchema = new Schema({
  paymentNumber: { type: String, required: true, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  paymentDate: { type: Date, required: true, default: Date.now },

  paymentMethod: { type: String, enum: ["CASH", "CHEQUE", "BANK_TRANSFER", "CARD", "ONLINE"], required: true },
  totalAmount: { type: Number, required: true },

  // Cheque-specific fields live on the Cheque collection (see §4), linked from here
  chequeRef: { type: Schema.Types.ObjectId, ref: "Cheque" },

  allocations: [{
    invoice: { type: Schema.Types.ObjectId, ref: "SalesInvoice", required: true },
    allocatedAmount: { type: Number, required: true }
  }],

  unallocatedAmount: { type: Number, default: 0 },  // this is your "overhead"/overpayment — see §5

  status: {
    type: String,
    enum: ["PENDING", "CONFIRMED", "REVERSED"],  // PENDING useful while a cheque is uncleared
    default: "CONFIRMED"
  },

  receivedBy: { type: Schema.Types.ObjectId, ref: "User" },
  remarks: String,

}, { timestamps: true });
```

**Allocation logic (service function, inside a transaction):**

1. Fetch the customer's open invoices, oldest-due-first (FIFO), *or* accept manual allocation from the UI (accounts staff often want to pick specific invoices — support both modes).
2. Apply `totalAmount` across invoices until either the amount runs out or all selected invoices are fully paid.
3. For each invoice touched: increment `SalesInvoice.paidAmount`, recompute `balanceAmount` and `status`.
4. Any leftover amount → `unallocatedAmount`, which becomes an `ADVANCE_RECEIVED` ledger entry (see §5).
5. Write one `CustomerLedgerEntry` (`entryType: "PAYMENT"`, `direction: "CREDIT"`, `amount: totalAmount`) — the allocation detail lives on the `CustomerPayment.allocations[]` array; the ledger entry represents the whole payment as one clean line, keeping the ledger readable. (Some ERPs write one ledger line per allocation instead — either works; one-line-per-payment is simpler to reconcile against bank statements.)

---

## 4. Cheques — their own lifecycle

A cheque isn't just "a payment method" — it has a state machine, because it can bounce *after* you've already recorded the payment and reduced the customer's outstanding.

```js
const ChequeSchema = new Schema({
  chequeNumber: { type: String, required: true },
  bankName: String,
  branchName: String,
  chequeDate: Date,          // date written on the cheque
  depositDate: Date,         // date your company deposited it
  clearanceDate: Date,       // date bank confirmed clearance

  amount: { type: Number, required: true },
  customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  payment: { type: Schema.Types.ObjectId, ref: "CustomerPayment", required: true },

  status: {
    type: String,
    enum: ["RECEIVED", "DEPOSITED", "CLEARED", "BOUNCED", "CANCELLED"],
    default: "RECEIVED"
  },
  bounceReason: String,
  bounceCharges: { type: Number, default: 0 },  // fee you may charge the customer for the bounce

}, { timestamps: true });

ChequeSchema.index({ chequeNumber: 1, bankName: 1, customer: 1 });
```

**Why this matters practically:** many businesses record the payment as soon as the cheque is *received*, not when it clears — because it removes the invoice from the "outstanding" list immediately for operational purposes (goods can be released, etc.). But that creates risk: if it bounces, you need a clean reversal path.

**Bounce handling (service function):**
1. Set `Cheque.status = "BOUNCED"`.
2. Reverse the original allocations: for each invoice in `CustomerPayment.allocations[]`, decrement `paidAmount` back, recompute `balanceAmount`/status.
3. Write a `CustomerLedgerEntry` (`entryType: "CHEQUE_BOUNCE"`, `direction: "DEBIT"`, `amount: chequeAmount`) — this puts the outstanding right back where it was.
4. If `bounceCharges > 0`, write an additional `DEBIT_NOTE` ledger entry for the fee.
5. Set the original `CustomerPayment.status = "REVERSED"`.

This is why payments should generally start as `status: "PENDING"` when the method is cheque, and only flip to `"CONFIRMED"` on clearance if your business wants to be conservative — or `"CONFIRMED"` immediately with a documented reversal path if you want the operational speed. Either is valid; pick one and be consistent.

---

## 5. Credit Notes

A credit note reduces what a customer owes — sales return, pricing correction, negotiated discount, or goodwill gesture. Structurally it behaves like a payment: it needs to be **allocated** against invoices too.

```js
const CreditNoteSchema = new Schema({
  creditNoteNumber: { type: String, required: true, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  reason: {
    type: String,
    enum: ["SALES_RETURN", "PRICE_CORRECTION", "DISCOUNT", "GOODWILL", "OTHER"],
    required: true
  },
  linkedInvoice: { type: Schema.Types.ObjectId, ref: "SalesInvoice" },  // often issued against a specific invoice
  linkedSalesReturn: { type: Schema.Types.ObjectId, ref: "SalesReturn" }, // if it's tied to a physical stock return

  amount: { type: Number, required: true },
  allocations: [{
    invoice: { type: Schema.Types.ObjectId, ref: "SalesInvoice", required: true },
    allocatedAmount: { type: Number, required: true }
  }],
  unallocatedAmount: { type: Number, default: 0 },  // can also become an advance, same as overpayment

  status: { type: String, enum: ["DRAFT", "POSTED", "CANCELLED"], default: "DRAFT" },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },  // credit notes often need approval — they reduce revenue
  remarks: String,

}, { timestamps: true });
```

Posting a credit note writes a `CustomerLedgerEntry` (`entryType: "CREDIT_NOTE"`, `direction: "CREDIT"`). If it's tied to a `SalesReturn`, that in turn should trigger a stock-in movement in your existing stock module (`transactionType: "SALES_RETURN"`, `direction: "IN"`) — this is a nice example of the two modules meeting cleanly through references, not entanglement.

---

## 6. Handling overpayment ("overhead") — advances & credit balances

This is the part worth being precise about, because "the customer paid more than they owed" is a genuinely common real-world event (rounding, early bulk payment, mistake) and needs a clean model — not a negative number sitting awkwardly on an invoice.

**Model it as a customer *advance/credit balance*, not a modification to any invoice.**

Flow:
1. Payment comes in for $1,000. Customer's open invoices only total $700.
2. Allocate $700 across the open invoices as normal (`allocations[]`).
3. The remaining $300 → `CustomerPayment.unallocatedAmount = 300`.
4. Write a `CustomerLedgerEntry`: `entryType: "ADVANCE_RECEIVED"`, `direction: "CREDIT"`, `amount: 300`. This increases `CustomerBalanceSummary.advanceBalance` by 300, and decreases `netPosition` — the customer is now $300 "ahead" of you.
5. **Later**, when a new invoice is raised for this customer, your invoice-posting service should check `advanceBalance` and offer to auto-apply it: write an `ADVANCE_ALLOCATED` entry that nets against the new `INVOICE` debit entry, reducing both the invoice's `balanceAmount` and the customer's `advanceBalance` together, inside the same transaction.
6. If the customer never uses it and wants it back in cash instead, post a `REFUND` entry (`direction: "DEBIT"`, reducing `advanceBalance` back down) alongside your actual bank/cash payout record.

This keeps invoices historically accurate (an invoice's `grandTotal` never gets edited after posting) while still giving you a clean, always-correct running "does this customer owe us or are we holding their money" figure via `netPosition`.

---

## 7. Customer Outstandings & Aging — this becomes a query, not a stored field

Once the ledger exists, "outstandings" is just a report:

```js
// Open invoices per customer, with days overdue
SalesInvoice.aggregate([
  { $match: { status: { $in: ["POSTED", "PARTIALLY_PAID", "OVERDUE"] } } },
  { $addFields: {
      daysOverdue: { $divide: [{ $subtract: [new Date(), "$dueDate"] }, 1000*60*60*24] }
  }},
  { $group: {
      _id: "$customer",
      totalOutstanding: { $sum: "$balanceAmount" },
      invoices: { $push: { invoiceNumber: "$invoiceNumber", balanceAmount: "$balanceAmount", daysOverdue: "$daysOverdue" } }
  }}
])
```

A scheduled job (cron / node-cron) can run nightly to flip `SalesInvoice.status` from `PARTIALLY_PAID`/`POSTED` to `OVERDUE` once `dueDate` has passed, so your UI doesn't need to compute this live everywhere.

**Aging buckets** (0-30, 31-60, 61-90, 90+ days) are a standard report on top of the same data — no new collection needed, just a `$bucket` aggregation stage on `daysOverdue`.

---

## 8. Credit limit enforcement (ties it all together)

Before a new `SalesInvoice` (or even the underlying sales order) is posted:

```js
const summary = await CustomerBalanceSummary.findOne({ customer: customerId });
const projectedOutstanding = summary.totalOutstanding + newInvoiceAmount - summary.advanceBalance;

if (customer.creditLimit > 0 && projectedOutstanding > customer.creditLimit) {
  // block, or require approval override, per your business rules
}
```

This is why `CustomerBalanceSummary` needs to be transactionally consistent with the ledger — credit control decisions happen in real time at order/invoice creation, and can't wait for an overnight batch job.

---

## 9. Single writer principle (same rule as stock)

Just like `stockLedgerService` was the only code path allowed to write `StockLedgerEntry`/`StockSummary`, introduce **one `customerLedgerService`** that is the *only* place allowed to write `CustomerLedgerEntry` / update `CustomerBalanceSummary`. Every other service — invoice posting, payment recording, cheque bounce handling, credit note posting, refunds — calls into it rather than touching the ledger/summary directly. This is what keeps a financial module reconcilable months later when someone asks "why doesn't this customer's balance match the invoices."

```
/models
  /customers
    Customer.js
    SalesInvoice.js
    CustomerPayment.js
    Cheque.js
    CreditNote.js
    CustomerLedgerEntry.js
    CustomerBalanceSummary.js

/services
  customerLedgerService.js   // sole writer to ledger + summary
  invoiceService.js          // posts invoices, checks credit limit
  paymentService.js          // allocation logic, advance handling
  chequeService.js           // status lifecycle, bounce reversal
  creditNoteService.js
  agingReportService.js
```

---

## 10. Suggested build order

1. `Customer` master + credit limit fields.
2. `SalesInvoice` (draft → posted), no payments yet — get invoicing solid first.
3. `CustomerLedgerEntry` + `CustomerBalanceSummary` + `customerLedgerService` — the foundation, mirroring what you already built for stock.
4. `CustomerPayment` with allocation logic (FIFO first, manual allocation UI after).
5. Overpayment/advance handling (§6) — small but easy to get wrong if bolted on later, so build it alongside payments, not after.
6. `Cheque` lifecycle + bounce reversal.
7. `CreditNote` + link to sales returns (ties back into your stock module's `SALES_RETURN` movement).
8. Aging/outstanding reports, credit-limit enforcement on new invoices, overdue-status cron job.

Because this reuses the same ledger + summary + "single writer service" pattern as stock, a developer who understands one module will read the other in minutes — that consistency is worth protecting as you build it out.
