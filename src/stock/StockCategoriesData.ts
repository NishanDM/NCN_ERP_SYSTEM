// ---- Types --------------------------------------------------------------

export interface StockSubCategory {
  id: string
  name: string
  itemCount: number
}

export interface StockCategory {
  id: string
  name: string
  subCategories: StockSubCategory[]
}

// ---- Derived counts -------------------------------------------------------

export function getCategoryItemCount(category: StockCategory): number {
  return category.subCategories.reduce((sum, sub) => sum + sub.itemCount, 0)
}

export function getTotalItemCount(categories: StockCategory[]): number {
  return categories.reduce((sum, category) => sum + getCategoryItemCount(category), 0)
}

// ---- Seed data --------------------------------------------------------------

export const INITIAL_STOCK_CATEGORIES: StockCategory[] = [
  {
    id: "electronics",
    name: "Electronics",
    subCategories: [
      { id: "sensors", name: "Sensors", itemCount: 42 },
      { id: "microcontrollers", name: "Microcontrollers", itemCount: 18 },
      { id: "cables", name: "Cables & Connectors", itemCount: 65 },
    ],
  },
  {
    id: "raw-materials",
    name: "Raw Materials",
    subCategories: [
      { id: "metals", name: "Metals", itemCount: 30 },
      { id: "plastics", name: "Plastics", itemCount: 21 },
    ],
  },
  {
    id: "packaging",
    name: "Packaging",
    subCategories: [{ id: "boxes", name: "Boxes", itemCount: 120 }],
  },
  {
    id: "office-supplies",
    name: "Office Supplies",
    subCategories: [],
  },
]