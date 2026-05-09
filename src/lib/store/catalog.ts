// Pricing primitives for the store. The product catalog itself moved
// to the database (store_products + store_variants); see lib/store/db.ts
// for the read helpers and src/app/admin/store/products/ for the admin
// CRUD. The bits that stayed here are framework-y constants — payment
// methods, the service fee, and the USD formatter — that don't belong
// in the database because they're code-side business rules.

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
