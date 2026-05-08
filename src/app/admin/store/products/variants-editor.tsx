"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Card, Field, Input } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";
import { saveVariants, type VariantSaveState } from "./actions";

// Inline variants editor used on the product edit page. The founder
// adds rows, edits prices, marks rows for deletion — then clicks Save
// once and we reconcile the whole batch in a single server action.

export type VariantRow = {
  id: string | null;
  sku: string;
  size: string;
  price_dollars: string; // human-friendly, "49" or "67.50"
  length_inches: string;
  width_inches: string;
  display_order: string;
  active: boolean;
};

export function VariantsEditor({
  productId,
  initial,
  showDimensions,
}: {
  productId: string;
  initial: VariantRow[];
  /** Show length/width columns. Toggled per-product (e.g. shirts only). */
  showDimensions: boolean;
}) {
  const action = saveVariants.bind(null, productId);
  const [state, formAction, pending] = useActionState<
    VariantSaveState,
    FormData
  >(action, undefined);
  const { toast } = useToast();

  const [rows, setRows] = useState<VariantRow[]>(initial);
  const [tombstones, setTombstones] = useState<Set<string>>(new Set());

  // Surface action result via toast — render-time pattern, see CLAUDE.md.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state) {
      if (state.ok === true) {
        toast({
          tone: "ok",
          title: "Variants saved",
          description: `Saved ${state.saved}, deleted ${state.deleted}.`,
        });
      } else {
        toast({
          tone: "err",
          title: "Couldn't save variants",
          description: state.message,
        });
      }
    }
  }

  function update(index: number, patch: Partial<VariantRow>) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: null,
        sku: "",
        size: "",
        price_dollars: "",
        length_inches: "",
        width_inches: "",
        display_order: String((prev.length + 1) * 10),
        active: true,
      },
    ]);
  }

  function markDelete(index: number) {
    const r = rows[index];
    if (r.id) {
      // Existing row — flag for server-side delete. Keep visible
      // until save, so the founder can undo.
      setTombstones((prev) => new Set(prev).add(r.id!));
    } else {
      // New unsaved row — drop it client-side.
      setRows((prev) => prev.filter((_, i) => i !== index));
    }
  }

  function unmarkDelete(id: string) {
    setTombstones((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-lg font-medium tracking-tight">
          Sizes &amp; pricing
        </h2>
        <p className="text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? "variant" : "variants"}
        </p>
      </div>

      <form action={formAction} className="space-y-3">
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No variants yet. Click <strong>Add variant</strong> below.
          </p>
        )}

        {rows.map((row, i) => {
          const isTombstoned = !!row.id && tombstones.has(row.id);
          return (
            <div
              key={row.id ?? `new-${i}`}
              className={
                "rounded-md border px-3 py-3 " +
                (isTombstoned
                  ? "border-vermillion/30 bg-vermillion/5"
                  : "border-foreground/10 bg-card")
              }
            >
              {row.id && (
                <input
                  type="hidden"
                  name={`variants[${i}][id]`}
                  value={row.id}
                />
              )}
              {isTombstoned && (
                <input
                  type="hidden"
                  name={`variants[${i}][delete]`}
                  value="1"
                />
              )}
              <div
                className={
                  "grid gap-3 " +
                  (showDimensions
                    ? "grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto]"
                    : "grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]")
                }
              >
                <Field label="SKU" htmlFor={`v-sku-${i}`}>
                  <Input
                    id={`v-sku-${i}`}
                    name={`variants[${i}][sku]`}
                    value={row.sku}
                    onChange={(e) => update(i, { sku: e.target.value })}
                    disabled={isTombstoned}
                    required={!isTombstoned}
                  />
                </Field>
                <Field label="Size" htmlFor={`v-size-${i}`}>
                  <Input
                    id={`v-size-${i}`}
                    name={`variants[${i}][size]`}
                    value={row.size}
                    onChange={(e) => update(i, { size: e.target.value })}
                    disabled={isTombstoned}
                  />
                </Field>
                <Field label="Price (USD)" htmlFor={`v-price-${i}`}>
                  <Input
                    id={`v-price-${i}`}
                    name={`variants[${i}][price_dollars]`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.price_dollars}
                    onChange={(e) =>
                      update(i, { price_dollars: e.target.value })
                    }
                    disabled={isTombstoned}
                    required={!isTombstoned}
                  />
                </Field>
                {showDimensions && (
                  <>
                    <Field label="Length″" htmlFor={`v-length-${i}`}>
                      <Input
                        id={`v-length-${i}`}
                        name={`variants[${i}][length_inches]`}
                        type="number"
                        step="0.25"
                        min="0"
                        value={row.length_inches}
                        onChange={(e) =>
                          update(i, { length_inches: e.target.value })
                        }
                        disabled={isTombstoned}
                      />
                    </Field>
                    <Field label="Width″" htmlFor={`v-width-${i}`}>
                      <Input
                        id={`v-width-${i}`}
                        name={`variants[${i}][width_inches]`}
                        type="number"
                        step="0.25"
                        min="0"
                        value={row.width_inches}
                        onChange={(e) =>
                          update(i, { width_inches: e.target.value })
                        }
                        disabled={isTombstoned}
                      />
                    </Field>
                  </>
                )}
                <Field label="Order" htmlFor={`v-order-${i}`}>
                  <Input
                    id={`v-order-${i}`}
                    name={`variants[${i}][display_order]`}
                    type="number"
                    min="0"
                    value={row.display_order}
                    onChange={(e) =>
                      update(i, { display_order: e.target.value })
                    }
                    disabled={isTombstoned}
                  />
                </Field>
                <div className="flex items-end pb-1">
                  {isTombstoned ? (
                    <button
                      type="button"
                      onClick={() => unmarkDelete(row.id!)}
                      className="text-xs uppercase tracking-[0.18em] text-foreground/55 hover:text-foreground"
                    >
                      Undo
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => markDelete(i)}
                      aria-label="Mark for deletion"
                      title="Mark for deletion"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-vermillion/10 hover:text-vermillion"
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  )}
                </div>
              </div>
              {!isTombstoned && (
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    name={`variants[${i}][active]`}
                    checked={row.active}
                    onChange={(e) => update(i, { active: e.target.checked })}
                    className="accent-vermillion"
                  />
                  <span>Active (visible on public store + order form)</span>
                </label>
              )}
            </div>
          );
        })}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent/10"
          >
            <Plus size={14} aria-hidden /> Add variant
          </button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save variants"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
