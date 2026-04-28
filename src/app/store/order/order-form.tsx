"use client";

import { useActionState, useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import {
  CATALOG,
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  PAYMENT_METHODS,
  SERVICE_FEE_CENTS,
  formatUsd,
  methodHasServiceFee,
  type CatalogCategory,
  type CatalogItem,
  type PaymentMethod,
} from "@/lib/store/catalog";
import { submitOrder, type OrderState } from "./actions";

const INITIAL: OrderState = { status: "idle" };

export function OrderForm() {
  const [state, formAction, pending] = useActionState(submitOrder, INITIAL);
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const submitted = useMemo(
    () => (state.status === "error" ? state.values ?? {} : {}),
    [state],
  );
  const v = (key: string) =>
    typeof submitted[key] === "string" ? (submitted[key] as string) : "";

  // Quantities keyed by SKU. Initialize from the previous form values
  // so a validation error doesn't wipe their cart.
  const initialQty = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [k, val] of Object.entries(submitted)) {
      if (!k.startsWith("q_")) continue;
      const sku = k.slice(2);
      const n = parseInt(typeof val === "string" ? val : "", 10);
      if (Number.isFinite(n) && n > 0) out[sku] = n;
    }
    return out;
  }, [submitted]);

  const [qty, setQty] = useState<Record<string, number>>(initialQty);
  const [method, setMethod] = useState<PaymentMethod>(
    (v("payment_method") || "zelle") as PaymentMethod,
  );

  const subtotal = useMemo(
    () =>
      CATALOG.reduce(
        (sum, item) => sum + (qty[item.sku] ?? 0) * item.price_cents,
        0,
      ),
    [qty],
  );
  const serviceFee = methodHasServiceFee(method) ? SERVICE_FEE_CENTS : 0;
  const total = subtotal + serviceFee;
  const itemCount = Object.values(qty).reduce(
    (n, c) => n + (Number.isFinite(c) ? c : 0),
    0,
  );

  const inc = (sku: string) =>
    setQty((q) => ({ ...q, [sku]: Math.min((q[sku] ?? 0) + 1, 99) }));
  const dec = (sku: string) =>
    setQty((q) => ({ ...q, [sku]: Math.max((q[sku] ?? 0) - 1, 0) }));

  const formKey = state.status === "error" ? "errored" : "fresh";

  return (
    <form key={formKey} action={formAction} className="grid gap-10" noValidate>
      {/* Honeypot */}
      <div aria-hidden className="absolute -left-[10000px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.status === "error" && (
        <p
          role="alert"
          className="rounded-md border border-vermillion/30 bg-vermillion/5 px-4 py-3 text-sm text-vermillion"
        >
          {state.message}
        </p>
      )}

      {/* Customer */}
      <fieldset className="grid gap-5 rounded-2xl border border-foreground/10 bg-card p-6 md:p-8">
        <legend className="font-display text-2xl tracking-tight px-2">
          Your details
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="First name"
            name="first_name"
            required
            autoComplete="given-name"
            defaultValue={v("first_name")}
            error={errors.first_name}
          />
          <Field
            label="Last name"
            name="last_name"
            required
            autoComplete="family-name"
            defaultValue={v("last_name")}
            error={errors.last_name}
          />
        </div>
        <Field
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          defaultValue={v("email")}
          error={errors.email}
        />
      </fieldset>

      {/* Items */}
      <div>
        <h2 className="font-display text-2xl tracking-tight mb-4">
          Place your order
        </h2>
        {errors.order_items && (
          <p
            role="alert"
            className="mb-3 rounded-md border border-vermillion/30 bg-vermillion/5 px-3 py-2 text-sm text-vermillion"
          >
            {errors.order_items}
          </p>
        )}
        <div className="grid gap-6">
          {CATEGORY_ORDER.map((cat) => (
            <CategoryGroup
              key={cat}
              category={cat}
              qty={qty}
              onInc={inc}
              onDec={dec}
            />
          ))}
        </div>
      </div>

      {/* Payment */}
      <fieldset className="grid gap-3 rounded-2xl border border-foreground/10 bg-card p-6 md:p-8">
        <legend className="font-display text-2xl tracking-tight px-2">
          Payment
        </legend>
        <p className="text-sm text-foreground/65 -mt-1 leading-relaxed">
          Zelle and Apple Cash to{" "}
          <span className="font-mono">832 381 6078</span>. PayPal/Venmo add a
          $5 service charge.
        </p>
        <div className="grid gap-2 mt-2">
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m.value}
              className={`flex items-center gap-3 rounded-md border bg-background px-3.5 py-2.5 cursor-pointer transition-colors ${
                method === m.value
                  ? "border-vermillion bg-vermillion/5"
                  : "border-foreground/15 hover:border-vermillion/40"
              }`}
            >
              <input
                type="radio"
                name="payment_method"
                value={m.value}
                checked={method === m.value}
                onChange={() => setMethod(m.value)}
                required
                className="h-4 w-4 accent-vermillion"
              />
              <span className="text-base">{m.label}</span>
            </label>
          ))}
        </div>
        {errors.payment_method && (
          <p role="alert" className="text-sm text-vermillion">
            {errors.payment_method}
          </p>
        )}
      </fieldset>

      {/* Summary */}
      <div className="rounded-2xl border border-foreground/10 bg-secondary/40 p-6 md:p-8">
        <h2 className="font-display text-2xl tracking-tight mb-4">Summary</h2>
        {itemCount === 0 ? (
          <p className="text-sm text-foreground/55 italic">
            No items selected yet — pick sizes above to see the total.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {CATALOG.filter((i) => (qty[i.sku] ?? 0) > 0).map((i) => (
              <li
                key={i.sku}
                className="flex items-baseline justify-between gap-3 border-b border-foreground/10 pb-2"
              >
                <span>
                  {i.name}{" "}
                  <span className="text-foreground/55">× {qty[i.sku]}</span>
                </span>
                <span className="font-mono tabular-nums">
                  {formatUsd((qty[i.sku] ?? 0) * i.price_cents)}
                </span>
              </li>
            ))}
            <li className="flex items-baseline justify-between gap-3 pt-2 text-foreground/70">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">{formatUsd(subtotal)}</span>
            </li>
            {serviceFee > 0 && (
              <li className="flex items-baseline justify-between gap-3 text-foreground/70">
                <span>{method === "paypal" ? "PayPal" : "Venmo"} service charge</span>
                <span className="font-mono tabular-nums">{formatUsd(serviceFee)}</span>
              </li>
            )}
            <li className="flex items-baseline justify-between gap-3 pt-2 text-base font-medium border-t border-foreground/15">
              <span>Total</span>
              <span className="font-mono tabular-nums text-vermillion">
                {formatUsd(total)}
              </span>
            </li>
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending || itemCount === 0}
          className="inline-flex items-center gap-3 rounded-full bg-vermillion px-7 py-4 text-base font-medium text-background hover:bg-vermillion-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <ShoppingBag size={16} aria-hidden />
          {pending ? "Submitting…" : "Submit order"}
        </button>
        <p className="text-xs text-foreground/55">
          Shirts are special-order — allow up to 4 weeks. You aren&apos;t fully
          enrolled until payment is received.
        </p>
      </div>
    </form>
  );
}

function CategoryGroup({
  category,
  qty,
  onInc,
  onDec,
}: {
  category: CatalogCategory;
  qty: Record<string, number>;
  onInc: (sku: string) => void;
  onDec: (sku: string) => void;
}) {
  const items = CATALOG.filter((i) => i.category === category);
  return (
    <section className="rounded-2xl border border-foreground/10 bg-card overflow-hidden">
      <header className="px-6 py-4 border-b border-foreground/10 bg-secondary/30">
        <p className="text-xs uppercase tracking-[0.25em] text-foreground/55">
          {CATEGORY_LABEL[category]}
        </p>
      </header>
      <ul className="divide-y divide-foreground/5">
        {items.map((item) => (
          <ItemRow
            key={item.sku}
            item={item}
            quantity={qty[item.sku] ?? 0}
            onInc={() => onInc(item.sku)}
            onDec={() => onDec(item.sku)}
          />
        ))}
      </ul>
    </section>
  );
}

function ItemRow({
  item,
  quantity,
  onInc,
  onDec,
}: {
  item: CatalogItem;
  quantity: number;
  onInc: () => void;
  onDec: () => void;
}) {
  const selected = quantity > 0;
  return (
    <li
      className={`flex items-center gap-4 px-6 py-3 ${
        selected ? "bg-vermillion/5" : ""
      }`}
    >
      <input
        type="hidden"
        name={`q_${item.sku}`}
        value={quantity > 0 ? String(quantity) : ""}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {item.size ? `Size ${item.size}` : item.name}
        </p>
        <p className="text-xs text-foreground/55 mt-0.5">
          {item.size ? item.name : ""}
          {item.size ? " · " : ""}
          <span className="font-mono tabular-nums text-foreground/70">
            {formatUsd(item.price_cents)}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDec}
          disabled={quantity === 0}
          aria-label={`Decrease ${item.name}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-foreground/15 hover:bg-foreground/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Minus size={14} aria-hidden />
        </button>
        <span className="font-mono tabular-nums text-sm w-6 text-center">
          {quantity}
        </span>
        <button
          type="button"
          onClick={onInc}
          aria-label={`Increase ${item.name}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-foreground/15 hover:bg-foreground/5 transition-colors"
        >
          <Plus size={14} aria-hidden />
        </button>
      </div>
    </li>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  defaultValue,
  autoComplete,
  inputMode,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal";
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-vermillion ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={!!error}
        className={`rounded-md border bg-background px-3.5 py-2.5 text-base transition-colors ${
          error
            ? "border-vermillion bg-vermillion/5"
            : "border-foreground/20 focus:border-vermillion"
        }`}
      />
      {error && (
        <p role="alert" className="text-sm text-vermillion">
          {error}
        </p>
      )}
    </div>
  );
}
