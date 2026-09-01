export const SUPPLIER_GOODS_CATEGORIES = [
  { value: "electronic_components", label: "Electronic Components" },
  { value: "home_appliances", label: "Home Appliances" },
  { value: "accessories_spare_parts", label: "Accessories & Spare Parts" },
  { value: "industrial_equipment", label: "Industrial Equipment" },
  { value: "packaging_consumables", label: "Packaging & Consumables" },
] as const

export type SupplierGoodsCategory =
  (typeof SUPPLIER_GOODS_CATEGORIES)[number]["value"]

export const getGoodsCategoryLabel = (value: string): string =>
  SUPPLIER_GOODS_CATEGORIES.find((opt) => opt.value === value)?.label ?? value

// ---- Credit period --------------------------------------------------------------

export type CreditPeriodDays = 45 | 60

export const CREDIT_PERIOD_OPTIONS: {
  value: CreditPeriodDays
  label: string
}[] = [
  { value: 45, label: "45 Days" },
  { value: 60, label: "60 Days" },
]

export const DEFAULT_CREDIT_PERIOD: CreditPeriodDays = 45

export const getCreditPeriodLabel = (value: number | null): string =>
  CREDIT_PERIOD_OPTIONS.find((opt) => opt.value === value)?.label ?? "—"

// ---- Supplier record --------------------------------------------------------------

export interface SupplierRecord {
  id: string
  supplierCode: string
  supplierName: string
  address: string
  /** Fixed/landline contact number. */
  contactNumber: string
  whatsappNumber: string
  email: string
  creditPeriodDays: CreditPeriodDays
  creditLimit: number
  remarks: string
  goodsCategories: SupplierGoodsCategory[]
}

// ---- Seed data --------------------------------------------------------------------

export const INITIAL_SUPPLIERS: SupplierRecord[] = [
  {
    id: "sup-001",
    supplierCode: "SUP001",
    supplierName: "MIHIRI MOTORS (PVT) LTD",
    address: "No 55/5, Bhawana Madyasthana Lane, Vidharshana, Homagama",
    contactNumber: "0112785477",
    whatsappNumber: "0775750477",
    email: "mihirimotorshomagama@gmail.com",
    creditPeriodDays: 45,
    creditLimit: 250000,
    remarks: "Reliable supplier for electronic components. Delivers weekly.",
    goodsCategories: ["electronic_components", "accessories_spare_parts"],
  },
  {
    id: "sup-002",
    supplierCode: "SUP002",
    supplierName: "ONAYA ENTERPRISES",
    address: "No 82/A/B, Sooriyapaluwa, Kadawatha",
    contactNumber: "0332295011",
    whatsappNumber: "0713550077",
    email: "onayaenterprises90@gmail.com",
    creditPeriodDays: 60,
    creditLimit: 500000,
    remarks: "Bulk supplier for home appliances.",
    goodsCategories: ["home_appliances"],
  },
  {
    id: "sup-003",
    supplierCode: "SUP003",
    supplierName: "EXIM HOUSE (PVT) LTD",
    address: "No 14, Negombo Road, Wattala",
    contactNumber: "0312493337",
    whatsappNumber: "0761361910",
    email: "eximhouse.wattala@gmail.com",
    creditPeriodDays: 45,
    creditLimit: 150000,
    remarks: "",
    goodsCategories: ["accessories_spare_parts", "packaging_consumables"],
  },
  {
    id: "sup-004",
    supplierCode: "SUP004",
    supplierName: "KANDY ELECTRO TRADERS",
    address: "No 210, Peradeniya Road, Kandy",
    contactNumber: "0812234891",
    whatsappNumber: "0772210984",
    email: "kandyelectro@gmail.com",
    creditPeriodDays: 45,
    creditLimit: 300000,
    remarks: "Fast turnaround on urgent orders. Main hub for the hill country.",
    goodsCategories: ["electronic_components"],
  },
  {
    id: "sup-005",
    supplierCode: "SUP005",
    supplierName: "SOUTHERN APPLIANCE HOUSE",
    address: "No 45, Wakwella Road, Galle",
    contactNumber: "0912244567",
    whatsappNumber: "0765512340",
    email: "southernappliance@gmail.com",
    creditPeriodDays: 60,
    creditLimit: 400000,
    remarks: "Preferred vendor for washing machines and refrigerators.",
    goodsCategories: ["home_appliances", "accessories_spare_parts"],
  },
  {
    id: "sup-006",
    supplierCode: "SUP006",
    supplierName: "KURUNEGALA HARDWARE & PARTS",
    address: "No 88, Puttalam Road, Kurunegala",
    contactNumber: "0372223456",
    whatsappNumber: "0714487712",
    email: "kurunegalahardware@gmail.com",
    creditPeriodDays: 45,
    creditLimit: 120000,
    remarks: "Small supplier, good for spare parts on short notice.",
    goodsCategories: ["accessories_spare_parts", "industrial_equipment"],
  },
  {
    id: "sup-007",
    supplierCode: "SUP007",
    supplierName: "KEGALLE CIRCUIT SOLUTIONS",
    address: "No 12, Colombo Road, Kegalle",
    contactNumber: "0352233890",
    whatsappNumber: "0778821345",
    email: "kegallecircuit@gmail.com",
    creditPeriodDays: 45,
    creditLimit: 180000,
    remarks: "",
    goodsCategories: ["electronic_components"],
  },
  {
    id: "sup-008",
    supplierCode: "SUP008",
    supplierName: "BALANGODA TRADE CENTRE",
    address: "No 5, Main Street, Balangoda",
    contactNumber: "0472245678",
    whatsappNumber: "0703345678",
    email: "balangodatrade@gmail.com",
    creditPeriodDays: 60,
    creditLimit: 220000,
    remarks: "Regional distributor for accessories, covers Sabaragamuwa.",
    goodsCategories: ["accessories_spare_parts", "home_appliances", "packaging_consumables"],
  },
  {
    id: "sup-009",
    supplierCode: "SUP009",
    supplierName: "MATARA DIGITAL SUPPLIES",
    address: "No 33, Anagarika Dharmapala Mawatha, Matara",
    contactNumber: "0412224789",
    whatsappNumber: "0776654321",
    email: "mataradigital@gmail.com",
    creditPeriodDays: 45,
    creditLimit: 275000,
    remarks: "New supplier, on a trial 3-month period.",
    goodsCategories: ["electronic_components"],
  },
  {
    id: "sup-010",
    supplierCode: "SUP010",
    supplierName: "BADULLA HOME SYSTEMS",
    address: "No 61, Bandarawela Road, Badulla",
    contactNumber: "0552233112",
    whatsappNumber: "0754471290",
    email: "badullahome@gmail.com",
    creditPeriodDays: 60,
    creditLimit: 350000,
    remarks: "Handles large-volume orders for appliances during festive season.",
    goodsCategories: ["home_appliances"],
  },
  {
    id: "sup-011",
    supplierCode: "SUP011",
    supplierName: "GAMPAHA ELECTRONICS HUB",
    address: "No 19, Ja-Ela Road, Gampaha",
    contactNumber: "0332276541",
    whatsappNumber: "0711198765",
    email: "gampahahub@gmail.com",
    creditPeriodDays: 45,
    creditLimit: 190000,
    remarks: "",
    goodsCategories: ["electronic_components", "accessories_spare_parts"],
  },
  {
    id: "sup-012",
    supplierCode: "SUP012",
    supplierName: "RATNAPURA PARTS & CO",
    address: "No 7, Pagoda Road, Ratnapura",
    contactNumber: "0452278903",
    whatsappNumber: "0723345566",
    email: "ratnapuraparts@gmail.com",
    creditPeriodDays: 45,
    creditLimit: 140000,
    remarks: "Occasional delays during monsoon season — plan orders ahead.",
    goodsCategories: ["accessories_spare_parts", "industrial_equipment"],
  },
  {
    id: "sup-013",
    supplierCode: "SUP013",
    supplierName: "TRINCO NORTHERN TRADERS",
    address: "No 22, Dockyard Road, Trincomalee",
    contactNumber: "0262223344",
    whatsappNumber: "0767789012",
    email: "trinconorthern@gmail.com",
    creditPeriodDays: 60,
    creditLimit: 260000,
    remarks: "Covers the eastern province, longer lead times on deliveries.",
    goodsCategories: ["home_appliances", "electronic_components"],
  },
  {
    id: "sup-014",
    supplierCode: "SUP014",
    supplierName: "NEGOMBO MARINE ELECTRICALS",
    address: "No 101, Lewis Place, Negombo",
    contactNumber: "0312238765",
    whatsappNumber: "0704456789",
    email: "negombomarine@gmail.com",
    creditPeriodDays: 45,
    creditLimit: 210000,
    remarks: "",
    goodsCategories: ["electronic_components"],
  },
  {
    id: "sup-015",
    supplierCode: "SUP015",
    supplierName: "ANURADHAPURA GENERAL SUPPLIES",
    address: "No 3, Maithreepala Senanayake Mawatha, Anuradhapura",
    contactNumber: "0252223456",
    whatsappNumber: "0759981234",
    email: "anuradhapurageneral@gmail.com",
    creditPeriodDays: 60,
    creditLimit: 300000,
    remarks: "Long-standing supplier, consistent stock availability.",
    goodsCategories: ["home_appliances", "accessories_spare_parts"],
  },
]

// ---- Helpers ------------------------------------------------------------------

const SUPPLIER_CODE_PREFIX = "SUP"
const SUPPLIER_CODE_PAD_LENGTH = 3

export function getNextSupplierCode(
  existingSuppliers: SupplierRecord[]
): string {
  const highest = existingSuppliers.reduce((max, supplier) => {
    const match = supplier.supplierCode.match(/(\d+)$/)
    const numericSuffix = match ? Number(match[1]) : 0
    return Math.max(max, numericSuffix)
  }, 0)

  return `${SUPPLIER_CODE_PREFIX}${String(highest + 1).padStart(SUPPLIER_CODE_PAD_LENGTH, "0")}`
}