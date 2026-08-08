# ERP Stock & Item Management — System Design (MERN)

## 1. The core idea: hybrid EAV (Entity–Attribute–Value)

You've correctly identified the hard part. Items are heterogeneous (a laptop has a serial number, a bag of cement doesn't), but you still need to **filter, search, and report** on attribute values efficiently — pure EAV in SQL is painful, but MongoDB's document model makes a *hybrid* EAV pattern very natural:

- **Attribute Definitions** = a reusable "dictionary" of possible attributes (master data).
- **Attribute Groups / Categories** = optional bundles that pre-select common attributes for a category of items (e.g. "Electronics" always has Serial No, Warranty Period).
- **Items** store their chosen attributes as an **array of `{attributeId, value}`** pairs, not as arbitrary free-form fields. This keeps it queryable and validated.

This gives you Excel-like flexibility with database-like integrity.

---

## 2. Collections

### 2.1 `AttributeDefinition` — the attribute dictionary

```js
const AttributeDefinitionSchema = new Schema({
  key: { type: String, required: true, unique: true, trim: true }, 
  // e.g. "serial_number" — machine-safe, used in code/queries
  label: { type: String, required: true }, 
  // e.g. "Serial Number" — human-readable, shown in UI

  dataType: {
    type: String,
    enum: ["string", "number", "boolean", "date", "objectId", "array", "enum"],
    required: true
  },

  // Only relevant when dataType === "objectId" — what collection does it reference?
  refCollection: { type: String, default: null }, // e.g. "Supplier", "Warehouse", "Brand"

  // Only relevant when dataType === "enum" — fixed list of allowed values
  enumOptions: [{ type: String }],

  // Only relevant when dataType === "array" — what's the type of each array element?
  arrayOf: {
    type: String,
    enum: ["string", "number", "objectId", "boolean"],
    default: null
  },

  unit: { type: String, default: null }, // "kg", "pcs", "m", etc. — optional UOM hint

  isRequired: { type: Boolean, default: false },
  isUnique: { type: Boolean, default: false },     // e.g. serial_number must be unique across items
  isSearchable: { type: Boolean, default: true },  // whether to index for filtering
  isSystemAttribute: { type: Boolean, default: false }, // protects built-ins from deletion

  validation: {
    min: Number,
    max: Number,
    minLength: Number,
    maxLength: Number,
    regexPattern: String
  },

  defaultValue: Schema.Types.Mixed,
  helpText: String,
  isActive: { type: Boolean, default: true },

}, { timestamps: true });
```

**Why this shape works:** `dataType` drives both frontend rendering (render a date picker vs a checkbox vs a dropdown-of-suppliers) and backend validation (validate against the correct rule). `refCollection` is what lets an attribute value be a real Mongo relationship (e.g. "Preferred Supplier" attribute pointing to the `Supplier` collection) instead of a dumb string.

---

### 2.2 `AttributeGroup` (a.k.a. Item Template) — reusable presets

Instead of manually picking 15 attributes every time you register a "Laptop", you attach a template.

```js
const AttributeGroupSchema = new Schema({
  name: { type: String, required: true },        // "Electronics - IT Equipment"
  description: String,
  attributes: [{
    attributeId: { type: Schema.Types.ObjectId, ref: "AttributeDefinition", required: true },
    isRequiredOverride: Boolean,   // allow overriding required-ness per group
    displayOrder: Number
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
```

### 2.3 `ItemCategory`

```js
const ItemCategorySchema = new Schema({
  name: { type: String, required: true },
  parentCategory: { type: Schema.Types.ObjectId, ref: "ItemCategory", default: null }, // for nested categories
  defaultAttributeGroup: { type: Schema.Types.ObjectId, ref: "AttributeGroup", default: null },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
```

### 2.4 `Item` — the master item record

```js
const ItemSchema = new Schema({
  itemCode: { type: String, required: true, unique: true }, // internal SKU, auto-generated
  name: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: "ItemCategory", required: true },
  attributeGroup: { type: Schema.Types.ObjectId, ref: "AttributeGroup" },

  // The dynamic part
  attributes: [{
    attributeId: { type: Schema.Types.ObjectId, ref: "AttributeDefinition", required: true },
    value: Schema.Types.Mixed   // interpreted according to attributeId.dataType
  }],

  uom: { type: String, default: "pcs" },          // base unit of measure
  trackingType: {
    type: String,
    enum: ["none", "batch", "serial"],             // does this item need lot/batch or serial tracking?
    default: "none"
  },

  reorderLevel: { type: Number, default: 0 },
  reorderQty: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },

  // Cached/denormalized for fast listing without joins
  primaryImage: String,
  currentAvgCost: { type: Number, default: 0 },   // maintained by stock transactions

}, { timestamps: true });

ItemSchema.index({ "attributes.attributeId": 1, "attributes.value": 1 }); // enables filtering by attribute
```

**Important practical detail:** validate `attributes[].value` against the referenced `AttributeDefinition.dataType` **at the application layer** (Mongoose pre-save hook or service-layer validator), since Mongo itself can't enforce "this Mixed field must be a number if type X, ObjectId if type Y." Write one shared validator function used both when creating an item and when editing attribute values later.

---

## 3. Item Attribute Value semantics — a concrete example

Say you define these `AttributeDefinition`s:

| key | label | dataType | refCollection |
|---|---|---|---|
| `serial_number` | Serial Number | string | — |
| `part_number` | Part Number | string | — |
| `warranty_months` | Warranty (months) | number | — |
| `is_hazardous` | Hazardous Material | boolean | — |
| `preferred_supplier` | Preferred Supplier | objectId | Supplier |
| `compatible_models` | Compatible Models | array (arrayOf: string) | — |
| `color` | Color | enum | — (enumOptions: ["Red","Blue","Black"]) |

When registering item "Dell Latitude 5440", you pick attributeGroup "IT Equipment" which pre-loads `serial_number`, `part_number`, `warranty_months`, `preferred_supplier`. The saved `Item.attributes` array looks like:

```js
attributes: [
  { attributeId: ObjectId("serial_number_id"), value: "SN-4472-XZ" },
  { attributeId: ObjectId("part_number_id"), value: "DL-5440-2024" },
  { attributeId: ObjectId("warranty_months_id"), value: 24 },
  { attributeId: ObjectId("preferred_supplier_id"), value: ObjectId("supplier_id_abc") }
]
```

A bag of cement, using attributeGroup "Construction Material", would simply never have `serial_number` in its array — no null-padding, no wasted schema.

---

## 4. Stock tracking layer — this is where real ERPs get it right or wrong

The single most important design decision: **never store "current stock quantity" as a mutable field you update in place.** Use a **perpetual ledger** (append-only transaction log) and derive current stock by aggregation (or a maintained summary collection for speed). This is how every serious ERP/accounting system works — it gives you full audit trail, prevents race-condition corruption, and lets you recompute stock as of any past date.

### 4.1 `Warehouse` / `Location`

```js
const WarehouseSchema = new Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
```

For bin-level tracking later, add a `Bin`/`Location` sub-collection under warehouse — but start simple.

### 4.2 `StockLedgerEntry` — the immutable source of truth

```js
const StockLedgerEntrySchema = new Schema({
  item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
  warehouse: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },

  batchOrSerial: { type: String, default: null }, // links to Batch/Serial collection if applicable

  transactionType: {
    type: String,
    enum: [
      "GRN",              // goods received (inward)
      "PURCHASE_RETURN",  // outward, back to supplier
      "SALES_ISSUE",      // outward, sold to customer
      "SALES_RETURN",     // inward, customer return
      "TRANSFER_OUT",     // outward, moving to another warehouse
      "TRANSFER_IN",      // inward, arriving from another warehouse
      "ADJUSTMENT_IN",    // inward, stock count correction / found stock
      "ADJUSTMENT_OUT",   // outward, stock count correction / damage / loss
      "PRODUCTION_ISSUE", // outward, raw material consumed
      "PRODUCTION_RECEIPT" // inward, finished goods produced
    ],
    required: true
  },

  direction: { type: String, enum: ["IN", "OUT"], required: true },
  quantity: { type: Number, required: true },       // always positive; direction gives sign
  rate: { type: Number, required: true },            // unit cost at time of transaction
  totalValue: { type: Number, required: true },      // quantity * rate

  refDocType: { type: String },   // "GRN", "SalesOrder", "StockTransfer", "StockAdjustment"
  refDocId: { type: Schema.Types.ObjectId },  // polymorphic link back to source document
  refDocNumber: String,            // human-readable doc number, e.g. "GRN-2026-0043"

  balanceQtyAfter: { type: Number },   // running balance snapshot (optional but very useful for audits)
  balanceValueAfter: { type: Number },

  remarks: String,
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  transactionDate: { type: Date, required: true, default: Date.now },

}, { timestamps: true });

StockLedgerEntrySchema.index({ item: 1, warehouse: 1, transactionDate: 1 });
```

**Golden rule:** application code never writes directly into an "Item.stockQty" field. Every stock movement — GRN, issue, transfer, adjustment — creates one (or a matching pair of) `StockLedgerEntry` documents. Current stock = `SUM(IN) - SUM(OUT)` per item/warehouse, ideally cached into a summary collection updated transactionally alongside the ledger insert.

### 4.3 `StockSummary` — fast-read cache (denormalized, rebuildable)

```js
const StockSummarySchema = new Schema({
  item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
  warehouse: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
  quantityOnHand: { type: Number, default: 0 },
  quantityReserved: { type: Number, default: 0 },   // allocated to open sales orders
  quantityAvailable: { type: Number, default: 0 },  // onHand - reserved
  avgCost: { type: Number, default: 0 },
  lastMovementDate: Date
}, { timestamps: true });

StockSummarySchema.index({ item: 1, warehouse: 1 }, { unique: true });
```

Update this with a MongoDB transaction (`session.withTransaction`) in the *same* operation that inserts the ledger entry, so they can never drift out of sync. If they ever do, you can always rebuild `StockSummary` by re-aggregating `StockLedgerEntry` — this is your safety net and audit tool.

### 4.4 Batch / Serial tracking

```js
const StockBatchSchema = new Schema({
  item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
  batchNumber: { type: String },       // for batch-tracked items (expiry-based goods, etc.)
  serialNumber: { type: String },      // for serial-tracked items (unique per unit)
  warehouse: { type: Schema.Types.ObjectId, ref: "Warehouse" },
  status: { type: String, enum: ["IN_STOCK", "ISSUED", "RETURNED", "SCRAPPED"], default: "IN_STOCK" },
  manufactureDate: Date,
  expiryDate: Date,
  grnRef: { type: Schema.Types.ObjectId, ref: "GRN" },
  currentOwnerDocRef: { type: Schema.Types.ObjectId } // e.g. which sales order it went out on
}, { timestamps: true });

StockBatchSchema.index({ item: 1, serialNumber: 1 }, { unique: true, sparse: true });
```

For serial-tracked items, each unit is literally one document here — quantity is always 1. For batch-tracked items, one batch document represents a quantity (e.g. 500kg of cement, batch #2026-06).

---

## 5. GRN (Goods Receipt Note) — the real-world inbound process

A realistic inbound flow rarely starts at GRN — it starts at procurement:

```
Purchase Requisition → Purchase Order (PO) → Goods arrive at gate
   → GRN created (matched against PO) → Quality Check (optional)
   → Accepted qty posted to Stock Ledger (IN) → Rejected qty flagged for return
   → Supplier Invoice matched against GRN (3-way match: PO / GRN / Invoice)
```

### 5.1 `PurchaseOrder`

```js
const PurchaseOrderSchema = new Schema({
  poNumber: { type: String, required: true, unique: true },
  supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
  items: [{
    item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    orderedQty: { type: Number, required: true },
    rate: { type: Number, required: true },
    receivedQty: { type: Number, default: 0 }   // updated as GRNs come in against this PO
  }],
  status: { type: String, enum: ["DRAFT", "APPROVED", "PARTIALLY_RECEIVED", "RECEIVED", "CLOSED", "CANCELLED"], default: "DRAFT" },
  expectedDate: Date,
}, { timestamps: true });
```

### 5.2 `GRN`

```js
const GRNSchema = new Schema({
  grnNumber: { type: String, required: true, unique: true },
  purchaseOrder: { type: Schema.Types.ObjectId, ref: "PurchaseOrder" }, // nullable — allow GRN without PO (direct receipt) if your business needs it
  supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
  warehouse: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },

  items: [{
    item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    orderedQty: Number,          // copied from PO line, for reference
    receivedQty: { type: Number, required: true },
    acceptedQty: { type: Number, required: true },
    rejectedQty: { type: Number, default: 0 },
    rejectionReason: String,
    rate: { type: Number, required: true },

    // for batch/serial-tracked items received in this GRN
    batchOrSerials: [{ batchNumber: String, serialNumber: String, quantity: Number }]
  }],

  qcStatus: { type: String, enum: ["PENDING", "PASSED", "PARTIAL", "FAILED"], default: "PENDING" },
  status: { type: String, enum: ["DRAFT", "POSTED", "CANCELLED"], default: "DRAFT" },
  receivedDate: { type: Date, default: Date.now },
  receivedBy: { type: Schema.Types.ObjectId, ref: "User" },
  remarks: String,

}, { timestamps: true });
```

**Posting logic (service function, run inside a Mongo transaction):**

1. Validate GRN items against the PO (quantities, rate tolerance).
2. For each accepted line: create `StockLedgerEntry` (`transactionType: "GRN"`, `direction: "IN"`).
3. If batch/serial-tracked, create the corresponding `StockBatch` documents.
4. Update `StockSummary` (increment `quantityOnHand`, recompute `avgCost` — typically weighted-average: `newAvgCost = (oldQty*oldAvgCost + receivedQty*receivedRate) / (oldQty+receivedQty)`).
5. Update `PurchaseOrder.items[].receivedQty`, recompute PO status.
6. Flip `GRN.status` to `POSTED` — **posted GRNs should be immutable**; corrections happen via a separate reversal/return document, never by editing history.

---

## 6. Other stock movement types (real-world completeness)

| Movement | Direction | Typical trigger |
|---|---|---|
| GRN | IN | Purchase order receipt |
| Purchase Return | OUT | Rejected/defective goods sent back to supplier |
| Sales Issue / Delivery Note | OUT | Fulfilling a sales order |
| Sales Return | IN | Customer returns goods |
| Stock Transfer Out/In | OUT then IN | Moving stock between warehouses (paired entries, same `refDocId`) |
| Stock Adjustment | IN or OUT | Physical stock count reconciliation, damage, theft, expiry write-off |
| Production Issue | OUT | Raw materials consumed in manufacturing (if you add a BOM/production module later) |
| Production Receipt | IN | Finished goods produced |

Model each as its own document type (`StockTransfer`, `StockAdjustment`, `SalesIssue`, etc.) with its own header + line-items + approval workflow, but **all of them ultimately post into the same `StockLedgerEntry` collection** — this keeps reporting (stock valuation, movement history, item ledger) unified regardless of *why* stock moved.

---

## 7. Suggested folder/module structure (backend)

```
/models
  /attributes
    AttributeDefinition.js
    AttributeGroup.js
  /items
    Item.js
    ItemCategory.js
  /stock
    Warehouse.js
    StockLedgerEntry.js
    StockSummary.js
    StockBatch.js
  /procurement
    Supplier.js
    PurchaseOrder.js
    GRN.js
  /stock-transactions
    StockTransfer.js
    StockAdjustment.js

/services
  attributeValidationService.js   // validates Item.attributes[] against AttributeDefinition.dataType
  stockLedgerService.js           // the ONLY place that writes StockLedgerEntry + updates StockSummary
  grnService.js                   // GRN posting logic (calls stockLedgerService)
  costingService.js               // weighted avg cost calculations

/controllers, /routes  → standard REST/Express layering per module
```

Keeping **one single `stockLedgerService`** as the sole writer to the ledger/summary collections (never letting controllers write directly) is the single highest-leverage architectural decision here — it's what prevents stock corruption bugs later.

---

## 8. Practical build order

1. `AttributeDefinition` CRUD + dataType-based validation logic.
2. `AttributeGroup` CRUD.
3. `ItemCategory` + `Item` CRUD (item registration using attribute groups).
4. `Warehouse`, `Supplier` master data.
5. `StockLedgerEntry` + `StockSummary` + the central `stockLedgerService`.
6. `PurchaseOrder` → `GRN` flow (inbound).
7. `SalesIssue`/delivery flow (outbound) — reuses `stockLedgerService`.
8. `StockTransfer`, `StockAdjustment`.
9. Batch/Serial tracking once the above is stable.
10. Reports: stock valuation, item ledger, reorder-level alerts, ABC analysis.

This order lets you demo something useful (item master + GRN + stock-in) very early, then layer outbound and adjustments on the same ledger foundation.
