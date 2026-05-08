import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "../product-form";
import { createProduct } from "../actions";

export const metadata = { title: "New product" };
export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <>
      <PageHeader
        title="New product"
        description="Create the marketing card. After save, you'll add per-size variants on the edit page."
        back="/admin/store/products"
      />
      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-6">
        <ProductForm
          action={createProduct}
          defaults={{ category: "shirt", active: true }}
          submitLabel="Create product"
          cancelHref="/admin/store/products"
        />
      </div>
    </>
  );
}
