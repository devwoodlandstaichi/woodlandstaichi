import { z } from "zod";

export const COHORT_OPTIONS = [
  { value: "2026-06", label: "June 2026" },
  { value: "2026-09", label: "September / October 2026" },
  { value: "2027-02", label: "February 2027" },
] as const;

// Session options used to live here as hardcoded (day_of_week, start_time)
// tuples, mapped back to a class row via `SESSION_TO_CLASS_KEY`. That
// silently broke whenever an admin edited a beginner class's day or time
// in /admin/classes. The form now receives the live list of active
// beginner classes from the page (see page.tsx) and posts the selected
// `class_id` directly.

export const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"] as const;

export const PAYMENT_METHODS = [
  { value: "zelle", label: "Zelle (preferred)" },
  { value: "venmo", label: "Venmo" },
  { value: "apple_pay", label: "Apple Pay" },
  { value: "paypal", label: "PayPal (+$5 service fee)" },
] as const;

const requiredString = (field: string, max = 200) =>
  z
    .string({ message: `${field} is required.` })
    .trim()
    .min(1, { message: `${field} is required.` })
    .max(max, { message: `${field} is too long.` });

const optionalString = (max = 1000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

export const registrationSchema = z.object({
  // Identity
  first_name: requiredString("First name", 100),
  last_name: requiredString("Last name", 100),
  nickname: optionalString(100),
  email: requiredString("Email")
    .email({ message: "Please enter a valid email address." }),
  phone: requiredString("Phone")
    .regex(/^[\d\s().+-]{7,}$/, { message: "Please enter a valid phone number." }),

  // Address
  street: requiredString("Street", 200),
  city: requiredString("City", 100),
  state: requiredString("State", 50),
  postal_code: requiredString("Postal code", 20),

  // Birthday
  birthday: requiredString("Birthday", 10).regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Please enter a valid date.",
  }),

  // Class preferences
  cohort: z.enum(COHORT_OPTIONS.map((o) => o.value) as [string, ...string[]], {
    message: "Please pick a cohort.",
  }),
  // Live class id chosen from the rendered list of active beginner
  // classes. The action verifies the row still exists + is active, so a
  // stale form pointing at an archived class fails clearly.
  class_id: z.uuid({ message: "Please pick a session." }),

  // Health & experience
  physical_limitations: optionalString(2000),
  prior_experience: optionalString(2000),

  // Shirt
  shirt_size: z.enum(SHIRT_SIZES, { message: "Please pick a shirt size." }),

  // Payment method
  payment_method: z.enum(
    PAYMENT_METHODS.map((m) => m.value) as [string, ...string[]],
    { message: "Please pick a payment method." },
  ),

  // About
  found_us_via: requiredString("How you found us", 1000),
  expectations: requiredString("What you hope to gain", 2000),

  // Emergency contact
  emergency_name: requiredString("Emergency contact name", 200),
  emergency_relationship: requiredString("Relationship", 100),
  emergency_phone: requiredString("Emergency phone")
    .regex(/^[\d\s().+-]{7,}$/, { message: "Please enter a valid phone number." }),

  // Waiver
  waiver_accepted: z
    .union([z.literal("on"), z.literal("true"), z.literal("1")])
    .transform(() => true)
    .pipe(z.literal(true)),
  waiver_signature: requiredString("Signature", 200),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

// Returning-player re-registration: a near-strict subset of the new-member
// form. Beginner-only commitments (shirt, payment, "how you found us",
// expectations, cohort) are dropped; address fields are optional; a new
// "change in status" textarea collects any updates since last enrollment.
export const returningRegistrationSchema = z.object({
  // Identity
  first_name: requiredString("First name", 100),
  last_name: requiredString("Last name", 100),
  email: requiredString("Email")
    .email({ message: "Please enter a valid email address." }),
  phone: requiredString("Phone")
    .regex(/^[\d\s().+-]{7,}$/, { message: "Please enter a valid phone number." }),

  // Address — optional, change-of-address only.
  street: optionalString(200),
  city: optionalString(100),
  state: optionalString(50),
  postal_code: optionalString(20),

  // The chosen class (any active non-beginner class).
  class_id: z.uuid({ message: "Please pick a class." }),

  // What's changed since last registration.
  status_changes: optionalString(2000),

  // Emergency contact
  emergency_name: requiredString("Emergency contact name", 200),
  emergency_relationship: requiredString("Relationship", 100),
  emergency_phone: requiredString("Emergency phone")
    .regex(/^[\d\s().+-]{7,}$/, { message: "Please enter a valid phone number." }),

  // Waiver
  waiver_accepted: z
    .union([z.literal("on"), z.literal("true"), z.literal("1")])
    .transform(() => true)
    .pipe(z.literal(true)),
  waiver_signature: requiredString("Signature", 200),
});

export type ReturningRegistrationInput = z.infer<
  typeof returningRegistrationSchema
>;
