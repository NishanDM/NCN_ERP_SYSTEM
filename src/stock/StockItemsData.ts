// ---- Types --------------------------------------------------------------

export type StockItemStatus = "active" | "inactive"

export interface StockItemRecord {
  id: string
  itemCode: string
  itemName: string
  brand: string
  stockKeepingUnit: string
  categoryName: string
  subCategoryName: string
  supplierName: string
  quantity: number
  reorderLevel: number
  supplierUnitPrice: number
  costPrice: number
  sellingPrice: number
  status: StockItemStatus
}

export type QuantityFilter = "all" | "in_stock" | "low_stock" | "out_of_stock"
export type StatusFilter = "all" | StockItemStatus

// ---- Derived stats ----------------------------------------------------------

export function getActiveItemCount(items: StockItemRecord[]): number {
  return items.filter((item) => item.status === "active").length
}

export function isLowStock(item: StockItemRecord): boolean {
  return item.quantity <= item.reorderLevel
}

export function getLowStockCount(items: StockItemRecord[]): number {
  return items.filter(isLowStock).length
}

export function getTotalStockValue(items: StockItemRecord[]): number {
  return items.reduce((sum, item) => sum + item.costPrice * item.quantity, 0)
}

export function getQuantityStatus(item: StockItemRecord): QuantityFilter {
  if (item.quantity === 0) return "out_of_stock"
  if (item.quantity <= item.reorderLevel) return "low_stock"
  return "in_stock"
}

// ---- Formatting -----------------------------------------------------------

export const formatCurrency = (value: number): string =>
  `Rs. ${value.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const formatAmount = (value: number): string =>
  value.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ---- Seed data (electronics shop) --------------------------------------------

export const INITIAL_STOCK_ITEMS: StockItemRecord[] = [
  {
    id: "1",
    itemCode: "SNS-1001",
    itemName: "PIR Motion Sensor Module HC-SR501",
    brand: "SunFounder",
    stockKeepingUnit: "HC-SR501",
    categoryName: "Electronics",
    subCategoryName: "Sensors",
    supplierName: "TechParts Lanka",
    quantity: 84,
    reorderLevel: 20,
    supplierUnitPrice: 180,
    costPrice: 220,
    sellingPrice: 350,
    status: "active",
  },
  {
    id: "2",
    itemCode: "SNS-1002",
    itemName: "DHT22 Temperature & Humidity Sensor",
    brand: "Aosong",
    stockKeepingUnit: "DHT22",
    categoryName: "Electronics",
    subCategoryName: "Sensors",
    supplierName: "TechParts Lanka",
    quantity: 6,
    reorderLevel: 10,
    supplierUnitPrice: 650,
    costPrice: 720,
    sellingPrice: 950,
    status: "active",
  },
  {
    id: "3",
    itemCode: "SNS-1003",
    itemName: "Ultrasonic Distance Sensor HC-SR04",
    brand: "SunFounder",
    stockKeepingUnit: "HC-SR04",
    categoryName: "Electronics",
    subCategoryName: "Sensors",
    supplierName: "Circuit Bazaar",
    quantity: 0,
    reorderLevel: 15,
    supplierUnitPrice: 150,
    costPrice: 190,
    sellingPrice: 300,
    status: "active",
  },
  {
    id: "4",
    itemCode: "MCU-2001",
    itemName: "Arduino Uno R3 Development Board",
    brand: "Arduino",
    stockKeepingUnit: "A000066",
    categoryName: "Electronics",
    subCategoryName: "Microcontrollers",
    supplierName: "Circuit Bazaar",
    quantity: 32,
    reorderLevel: 10,
    supplierUnitPrice: 2100,
    costPrice: 2400,
    sellingPrice: 3200,
    status: "active",
  },
  {
    id: "5",
    itemCode: "MCU-2002",
    itemName: "ESP32 DevKit V1 WiFi + Bluetooth Board",
    brand: "Espressif",
    stockKeepingUnit: "ESP32-DEVKITC",
    categoryName: "Electronics",
    subCategoryName: "Microcontrollers",
    supplierName: "TechParts Lanka",
    quantity: 4,
    reorderLevel: 8,
    supplierUnitPrice: 1350,
    costPrice: 1550,
    sellingPrice: 2100,
    status: "active",
  },
  {
    id: "6",
    itemCode: "MCU-2003",
    itemName: "Raspberry Pi Pico H",
    brand: "Raspberry Pi",
    stockKeepingUnit: "SC0917",
    categoryName: "Electronics",
    subCategoryName: "Microcontrollers",
    supplierName: "Circuit Bazaar",
    quantity: 12,
    reorderLevel: 6,
    supplierUnitPrice: 890,
    costPrice: 990,
    sellingPrice: 1350,
    status: "inactive",
  },
  {
    id: "7",
    itemCode: "CBL-3001",
    itemName: "Male-to-Male Jumper Wires (40pc)",
    brand: "Generic",
    stockKeepingUnit: "JW-MM-40",
    categoryName: "Electronics",
    subCategoryName: "Cables & Connectors",
    supplierName: "Circuit Bazaar",
    quantity: 210,
    reorderLevel: 50,
    supplierUnitPrice: 90,
    costPrice: 110,
    sellingPrice: 180,
    status: "active",
  },
  {
    id: "8",
    itemCode: "CBL-3002",
    itemName: "USB-C to USB-A Charging Cable 1m",
    brand: "Anker",
    stockKeepingUnit: "A8163",
    categoryName: "Electronics",
    subCategoryName: "Cables & Connectors",
    supplierName: "TechParts Lanka",
    quantity: 45,
    reorderLevel: 15,
    supplierUnitPrice: 420,
    costPrice: 480,
    sellingPrice: 650,
    status: "active",
  },
  {
    id: "9",
    itemCode: "CBL-3003",
    itemName: "JST-XH 2.54mm Connector Kit",
    brand: "Generic",
    stockKeepingUnit: "JST-XH-KIT",
    categoryName: "Electronics",
    subCategoryName: "Cables & Connectors",
    supplierName: "Circuit Bazaar",
    quantity: 0,
    reorderLevel: 20,
    supplierUnitPrice: 340,
    costPrice: 390,
    sellingPrice: 550,
    status: "inactive",
  },
  {
    id: "10",
    itemCode: "MTL-4001",
    itemName: "Aluminum Sheet 1mm 300x300mm",
    brand: "MetalWorks",
    stockKeepingUnit: "AL-SH-300",
    categoryName: "Raw Materials",
    subCategoryName: "Metals",
    supplierName: "Lanka Metal Supply",
    quantity: 18,
    reorderLevel: 5,
    supplierUnitPrice: 1100,
    costPrice: 1250,
    sellingPrice: 1600,
    status: "active",
  },
  {
    id: "11",
    itemCode: "MTL-4002",
    itemName: "Copper Wire Spool 0.5mm 100m",
    brand: "MetalWorks",
    stockKeepingUnit: "CU-W-100",
    categoryName: "Raw Materials",
    subCategoryName: "Metals",
    supplierName: "Lanka Metal Supply",
    quantity: 3,
    reorderLevel: 5,
    supplierUnitPrice: 2600,
    costPrice: 2850,
    sellingPrice: 3400,
    status: "active",
  },
  {
    id: "12",
    itemCode: "PLS-4101",
    itemName: "ABS Plastic Sheet 2mm 300x300mm",
    brand: "PolyForm",
    stockKeepingUnit: "ABS-SH-300",
    categoryName: "Raw Materials",
    subCategoryName: "Plastics",
    supplierName: "Lanka Metal Supply",
    quantity: 60,
    reorderLevel: 15,
    supplierUnitPrice: 480,
    costPrice: 550,
    sellingPrice: 750,
    status: "active",
  },
  {
    id: "13",
    itemCode: "BOX-5001",
    itemName: "Corrugated Shipping Box (Medium)",
    brand: "PackRight",
    stockKeepingUnit: "BOX-M-01",
    categoryName: "Packaging",
    subCategoryName: "Boxes",
    supplierName: "PackRight Supplies",
    quantity: 500,
    reorderLevel: 100,
    supplierUnitPrice: 45,
    costPrice: 55,
    sellingPrice: 85,
    status: "active",
  },
  {
    id: "14",
    itemCode: "BOX-5002",
    itemName: "Anti-Static Bubble Wrap Bag (Small)",
    brand: "PackRight",
    stockKeepingUnit: "BOX-S-AS",
    categoryName: "Packaging",
    subCategoryName: "Boxes",
    supplierName: "PackRight Supplies",
    quantity: 9,
    reorderLevel: 30,
    supplierUnitPrice: 25,
    costPrice: 32,
    sellingPrice: 55,
    status: "active",
  },
]