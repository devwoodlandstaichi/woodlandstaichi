// Catalog mirrors the legacy JotForm 200158184612146 SKUs and prices so
// existing records line up if/when we import historical orders. Quirks
// (doubled spaces, "Mediun") are preserved verbatim.

export type CatalogCategory =
  | "shirt"
  | "fan"
  | "jacket-ladies"
  | "jacket-mens"
  | "uniform"
  | "patch";

export type CatalogItem = {
  sku: string;
  name: string;
  category: CatalogCategory;
  price_cents: number;
  size?: string;
};

export const CATALOG: readonly CatalogItem[] = [
  // Shirts
  { sku: "1024", name: "WTC Shirt X Small", category: "shirt", price_cents: 4500, size: "XS" },
  { sku: "1000", name: "WTC  Shirt Small", category: "shirt", price_cents: 4700, size: "S" },
  { sku: "1004", name: "WTC Shirt Medium", category: "shirt", price_cents: 4900, size: "M" },
  { sku: "1005", name: "WTC Shirt Large", category: "shirt", price_cents: 5000, size: "L" },
  { sku: "1006", name: "WTC Shirt XLarge", category: "shirt", price_cents: 5300, size: "XL" },
  { sku: "1001", name: "WTC  Shirt  2XL", category: "shirt", price_cents: 5500, size: "2XL" },
  { sku: "1002", name: "WTC Shirt 3XL ", category: "shirt", price_cents: 6000, size: "3XL" },
  { sku: "1003", name: "WTC Shirt 4XL", category: "shirt", price_cents: 6500, size: "4XL" },

  // Fans
  { sku: "1007", name: "Fan Red", category: "fan", price_cents: 1500 },
  { sku: "1025", name: "WTC Fan w/pouch", category: "fan", price_cents: 1500 },

  // Ladies jackets
  { sku: "1008", name: "WTC Jacket  Ladies XSmall", category: "jacket-ladies", price_cents: 6600, size: "XS" },
  { sku: "1009", name: "WTC Jacket Ladies Small", category: "jacket-ladies", price_cents: 6700, size: "S" },
  { sku: "1010", name: "WTC Jacket Ladies Medium", category: "jacket-ladies", price_cents: 6900, size: "M" },
  { sku: "1011", name: "WTC Jacket Ladies Large", category: "jacket-ladies", price_cents: 7200, size: "L" },
  { sku: "1012", name: "WTC Jacket  Ladies XLarge", category: "jacket-ladies", price_cents: 7500, size: "XL" },
  { sku: "1013", name: "WTC Jacket Ladies 2XLarge", category: "jacket-ladies", price_cents: 7800, size: "2XL" },
  { sku: "1014", name: "WTC Jacket Ladies 3XLarge", category: "jacket-ladies", price_cents: 8000, size: "3XL" },
  { sku: "1015", name: "WTC Jacket Ladies 4XLarge", category: "jacket-ladies", price_cents: 8500, size: "4XL" },

  // Mens jackets — note 2XL is $73 in legacy form (likely a typo, preserved)
  { sku: "1016", name: "WTC Jacket Mens Small", category: "jacket-mens", price_cents: 6700, size: "S" },
  { sku: "1017", name: "WTC Jacket Mens Mediun", category: "jacket-mens", price_cents: 6900, size: "M" },
  { sku: "1018", name: "WTC Jacket Mens Large", category: "jacket-mens", price_cents: 7500, size: "L" },
  { sku: "1019", name: "WTC Jacket Mens XLarge", category: "jacket-mens", price_cents: 7800, size: "XL" },
  { sku: "1020", name: "WTC Jacket Mens 2XLarge", category: "jacket-mens", price_cents: 7300, size: "2XL" },
  { sku: "1021", name: "WTC Jacket Mens 3XLarge", category: "jacket-mens", price_cents: 8000, size: "3XL" },
  { sku: "1022", name: "WTC Jacket Mens 4XLarge", category: "jacket-mens", price_cents: 8500, size: "4XL" },

  // Other
  { sku: "1023", name: "Uniform", category: "uniform", price_cents: 5200 },
  { sku: "1026", name: "Patch", category: "patch", price_cents: 1000 },
] as const;

export const SKU_INDEX: ReadonlyMap<string, CatalogItem> = new Map(
  CATALOG.map((it) => [it.sku, it]),
);

export const CATEGORY_LABEL: Record<CatalogCategory, string> = {
  shirt: "WTC Shirt",
  fan: "Fans",
  "jacket-ladies": "Sport-Wick Jacket — Ladies",
  "jacket-mens": "Sport-Wick Jacket — Mens",
  uniform: "Tang Suit Uniform",
  patch: "WTC Patch",
};

export const CATEGORY_ORDER: CatalogCategory[] = [
  "shirt",
  "fan",
  "jacket-ladies",
  "jacket-mens",
  "uniform",
  "patch",
];

// PayPal / Venmo carry a $5 service charge added on submit.
export const SERVICE_FEE_CENTS = 500;

export const PAYMENT_METHODS = [
  { value: "zelle", label: "Zelle (preferred)" },
  { value: "apple_cash", label: "Apple Cash" },
  { value: "paypal", label: "PayPal (+$5 service charge)" },
  { value: "venmo", label: "Venmo (+$5 service charge)" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

export function isPaymentMethod(v: string): v is PaymentMethod {
  return PAYMENT_METHODS.some((m) => m.value === v);
}

export function methodHasServiceFee(m: PaymentMethod): boolean {
  return m === "paypal" || m === "venmo";
}

export function formatUsd(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}$${(abs / 100).toFixed(2)}`;
}
