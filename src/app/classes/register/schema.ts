import { z } from "zod";

export const COHORT_OPTIONS = [
  { value: "2026-06", label: "June 2026" },
  { value: "2026-09", label: "September / October 2026" },
  { value: "2027-02", label: "February 2027" },
] as const;

export const SESSION_OPTIONS = [
  { value: "wed-am", label: "Wednesday morning · 8:00–9:00 AM · TWMC" },
  { value: "wed-pm", label: "Wednesday evening · 5:15–6:15 PM · TWMC" },
  { value: "thu-am", label: "Thursday morning · 8:30–9:30 AM · KBCC" },
] as const;

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
  session: z.enum(SESSION_OPTIONS.map((o) => o.value) as [string, ...string[]], {
    message: "Please pick a session.",
  }),

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

// Map our session option → existing `classes` row by day_of_week + start_time.
// (Beginners only — Wednesday/Thursday at the seeded times.)
export const SESSION_TO_CLASS_KEY: Record<
  string,
  { day_of_week: string; start_time: string }
> = {
  "wed-am": { day_of_week: "wed", start_time: "08:00:00" },
  "wed-pm": { day_of_week: "wed", start_time: "17:15:00" },
  "thu-am": { day_of_week: "thu", start_time: "08:30:00" },
};
