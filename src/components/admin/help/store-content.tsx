import {
  Bullets,
  FaqItem,
  Intro,
  Note,
  Pill,
  Section,
  Step,
  Steps,
  Warning,
} from "./primitives";

export function StoreHelpContent() {
  return (
    <>
      <Intro>
        <p>
          The <strong>Store</strong> page is where you manage the
          products shown on the public store at{" "}
          <code className="rounded bg-foreground/10 px-1 py-0.5">
            woodlandstaichi.com/store
          </code>{" "}
          and on the order form. Each product has a marketing card
          (name, photo, description) and one or more <em>variants</em>{" "}
          (specific sizes with prices).
        </p>
      </Intro>

      <Section title="Products vs. variants" anchor="overview">
        <Bullets>
          <li>
            A <strong>product</strong> is a marketing card &mdash; the
            shirt, the jacket, the fan. One photo, one description.
          </li>
          <li>
            A <strong>variant</strong> is a specific size with a
            specific price &mdash; Shirt Medium $49, Shirt Large $50.
            One product has many variants.
          </li>
          <li>
            Some products have only one variant (the Tang Suit). Some
            have none (Recommended Shoes &mdash; we link to a
            recommendation, we don&rsquo;t sell shoes).
          </li>
        </Bullets>
      </Section>

      <Section title="Edit a product" anchor="edit">
        <Steps>
          <Step n={1}>
            On the <strong>Store</strong> page, click the product you
            want to edit.
          </Step>
          <Step n={2}>
            Change the name, tagline, description, or note. Upload or
            replace the photo.
          </Step>
          <Step n={3}>
            Click <Pill primary>Save product</Pill> at the top section.
          </Step>
        </Steps>
        <Note>
          The photo and the product details save together. Variants
          (sizes &amp; prices) save separately &mdash; see below.
        </Note>
      </Section>

      <Section title="Change a price" anchor="prices">
        <Steps>
          <Step n={1}>Open the product.</Step>
          <Step n={2}>
            Scroll to the <strong>Sizes &amp; pricing</strong> section.
          </Step>
          <Step n={3}>
            Type the new price (in dollars, e.g. <em>49.00</em>) into
            the <strong>Price (USD)</strong> field on that row.
          </Step>
          <Step n={4}>
            Click <Pill primary>Save variants</Pill> at the bottom.
          </Step>
        </Steps>
        <Note>
          Prices show the new value on the public site immediately.
          Existing orders that were placed at the old price are not
          affected &mdash; they keep what they paid.
        </Note>
      </Section>

      <Section title="Add a new size" anchor="add-size">
        <Steps>
          <Step n={1}>Open the product.</Step>
          <Step n={2}>
            In the <strong>Sizes &amp; pricing</strong> section, click{" "}
            <Pill>+ Add variant</Pill>.
          </Step>
          <Step n={3}>
            Fill in the SKU (a short unique code like <em>1027</em>),
            the size label, the price, and (for shirts only) the length
            and width in inches.
          </Step>
          <Step n={4}>
            Click <Pill primary>Save variants</Pill>.
          </Step>
        </Steps>
      </Section>

      <Section title="Hide a size temporarily" anchor="hide-size">
        <p>
          If you&rsquo;re out of stock on one size, hide it without
          deleting:
        </p>
        <Steps>
          <Step n={1}>Open the product.</Step>
          <Step n={2}>
            Find the row. Uncheck the <em>Active</em> checkbox below
            it.
          </Step>
          <Step n={3}>
            Click <Pill primary>Save variants</Pill>.
          </Step>
        </Steps>
        <p>
          Inactive variants disappear from the public site and the
          order form. Toggle Active on again to bring them back.
        </p>
      </Section>

      <Section title="Delete a size" anchor="delete-size">
        <Steps>
          <Step n={1}>Open the product.</Step>
          <Step n={2}>
            Click the trash icon on the row. The row turns red.
          </Step>
          <Step n={3}>
            (Optional) If you change your mind, click <em>Undo</em> on
            that row.
          </Step>
          <Step n={4}>
            Click <Pill primary>Save variants</Pill> to commit the
            deletion.
          </Step>
        </Steps>
        <Warning>
          Deletion is permanent. If a size has been sold before, hide
          it (uncheck Active) instead of deleting &mdash; that
          preserves the price history for old orders.
        </Warning>
      </Section>

      <Section title="Add a brand-new product" anchor="new-product">
        <Steps>
          <Step n={1}>
            Click <Pill primary>+ New product</Pill> at the top right
            of the Store page.
          </Step>
          <Step n={2}>
            Fill in the name, tagline, description, and pick a
            category.
          </Step>
          <Step n={3}>Upload a photo (optional but recommended).</Step>
          <Step n={4}>
            Click <Pill primary>Create product</Pill>.
          </Step>
          <Step n={5}>
            Add variants (sizes &amp; prices) on the next page using
            the <strong>Sizes &amp; pricing</strong> editor.
          </Step>
        </Steps>
      </Section>

      <Section title="Common questions" anchor="faq">
        <FaqItem q="What size should the photo be?">
          <p>
            Square photos look best on the cards. Anything from a
            phone or camera works &mdash; the website resizes
            automatically. Up to 5 MB.
          </p>
        </FaqItem>

        <FaqItem q="Will members get an email when I add a new product?">
          <p>No, posting to the store doesn&rsquo;t send any emails.</p>
        </FaqItem>

        <FaqItem q="What's the SKU field for?">
          <p>
            It&rsquo;s the unique code we use on order forms. Existing
            SKUs are preserved from the legacy form &mdash; pick a new
            number for new variants and don&rsquo;t reuse old ones.
          </p>
        </FaqItem>

        <FaqItem q="What's the discount link for?">
          <p>
            We use it for the recommended-shoes card &mdash; a
            partnership link to Fuego dance shoes. Most products
            don&rsquo;t have one.
          </p>
        </FaqItem>
      </Section>
    </>
  );
}
