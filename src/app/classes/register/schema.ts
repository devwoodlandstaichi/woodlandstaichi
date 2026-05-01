import { z } from "zod";

// New-beginner registration now picks a specific upcoming session
// (class_session row) that staff have marked newcomer_friendly. Old
// flow asked for a recurring class + a hand-picked cohort label;
// the cohort concept was admin-curated, brittle to edit, and didn't
// reflect the school's actual onboarding rhythm. With sessions
// instead, instructors flag specific drop-in dates and the form
// surfaces those automatically.

export const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"] as const;

export const SEX_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const;

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

  // Sex
  sex: z.enum(SEX_OPTIONS.map((o) => o.value) as [string, ...string[]], {
    message: "Please pick one.",
  }),

  // Live class_session id chosen from the rendered list of upcoming
  // newcomer-friendly sessions. The action verifies the row still
  // exists, is still flagged welcoming, and hasn't moved into the
  // past, so a stale form fails clearly with a "pick a current one".
  session_id: z.uuid({ message: "Please pick a session." }),

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

// Returning-player flow is now an approval queue, not a self-service
// re-registration. The form asks for nothing but an email — staff
// look the member up and approve or decline reactivation.
export const reactivationRequestSchema = z.object({
  email: requiredString("Email").email({
    message: "Please enter a valid email address.",
  }),
});

export type ReactivationRequestInput = z.infer<typeof reactivationRequestSchema>;
