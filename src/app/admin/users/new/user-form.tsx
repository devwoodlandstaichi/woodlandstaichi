"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, RotateCw } from "lucide-react";
import {
  Button,
  Field,
  Input,
  Select,
} from "@/components/admin/ui";
import { createUserAndRole, type UserFormState } from "../actions";

const ROLES = [
  { value: "instructor", label: "Instructor" },
  { value: "admin", label: "Admin" },
] as const;

function generatePassword(): string {
  // 16 chars, mix of cases + digits + a couple symbols. Sufficient
  // entropy and matches our server-side rules.
  const lower = "abcdefghijkmnpqrstuvwxyz"; // no 'l' / 'o'
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 'I' / 'O'
  const digits = "23456789"; // no 0/1
  const symbols = "@#%&*-_+";
  const all = lower + upper + digits + symbols;
  let out = "";
  // Guarantee at least one of each rule class
  out += lower[Math.floor(Math.random() * lower.length)];
  out += upper[Math.floor(Math.random() * upper.length)];
  out += digits[Math.floor(Math.random() * digits.length)];
  out += symbols[Math.floor(Math.random() * symbols.length)];
  while (out.length < 16) {
    out += all[Math.floor(Math.random() * all.length)];
  }
  return out
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export function UserForm() {
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(
    createUserAndRole,
    undefined,
  );
  const errors = state && state.ok === false ? state.errors ?? {} : {};
  const submitted =
    state && state.ok === false ? state.values : undefined;

  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const formKey = state && state.ok === false ? "errored" : "fresh";

  return (
    <form key={formKey} action={formAction} className="grid max-w-xl gap-5" noValidate>
      <Field label="Email" htmlFor="email" error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="off"
          defaultValue={submitted?.email ?? ""}
        />
      </Field>

      <Field label="Role" htmlFor="role" error={errors.role}>
        <Select
          id="role"
          name="role"
          defaultValue={submitted?.role ?? "instructor"}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        error={errors.password}
        hint="At least 12 chars with upper, lower, and digit. Share securely with the new user."
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10 font-mono"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5"
            >
              {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPassword(generatePassword());
              setShow(true);
            }}
          >
            <RotateCw size={14} aria-hidden /> Generate
          </Button>
        </div>
      </Field>

      {state && state.ok === false && state.message && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <div className="mt-2 flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create user"}
        </Button>
        <a
          href="/admin/users"
          className="inline-flex h-12 items-center justify-center rounded-md px-5 text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
