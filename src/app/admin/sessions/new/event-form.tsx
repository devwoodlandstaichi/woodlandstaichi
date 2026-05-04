"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, Sparkles } from "lucide-react";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/admin/ui";
import {
  createOneOffSession,
  type CreateEventState,
} from "../actions";

const LEVELS: Array<{ value: string; label: string }> = [
  { value: "beginners", label: "Beginners" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "remedial", label: "Remedial" },
  { value: "play_only", label: "Play only" },
  { value: "combined", label: "Combined" },
];

export function EventForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<CreateEventState, FormData>(
    async (prev, fd) => {
      const next = await createOneOffSession(prev, fd);
      if (next?.ok) router.push(`/admin/sessions/${next.sessionId}`);
      return next;
    },
    undefined,
  );

  const errors =
    state && state.ok === false ? state.fieldErrors ?? {} : {};
  const submitted =
    state && state.ok === false ? state.values ?? {} : {};
  const banner = state && state.ok === false ? state.message : null;
  const v = (key: string, fallback = "") => submitted[key] ?? fallback;

  // React 19 wipes uncontrolled inputs after a server-action call, so
  // we re-key the form on every error transition. New key → fresh
  // mount → defaultValue / defaultChecked re-apply from the snapshot
  // we just got back from the server.
  const [submitCount, setSubmitCount] = useState(0);
  const [lastState, setLastState] = useState<CreateEventState>(state);
  if (state !== lastState) {
    setLastState(state);
    if (state && state.ok === false) setSubmitCount((c) => c + 1);
  }

  // Initial render has no `submitted` snapshot — apply the same
  // defaults the action's checkbox parsing assumes (both on).
  const newcomerOn =
    submitted.newcomer_friendly !== undefined
      ? submitted.newcomer_friendly === "on"
      : true;
  const acceptingOn =
    submitted.accepting_rsvps !== undefined
      ? submitted.accepting_rsvps !== "off"
      : true;

  return (
    <form
      key={`event-form-${submitCount}`}
      action={formAction}
      className="grid gap-5"
      noValidate
    >
      {banner && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {banner}
        </p>
      )}

      <Field label="Event name" htmlFor="name" error={errors.name}>
        <Input
          id="name"
          name="name"
          required
          maxLength={200}
          placeholder="Spring Workshop with Sifu Sesco"
          defaultValue={v("name")}
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Level" htmlFor="level" error={errors.level}>
          <Select id="level" name="level" required defaultValue={v("level", "combined")}>
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Capacity"
          htmlFor="capacity"
          error={errors.capacity}
          hint="Leave blank for no cap."
        >
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={0}
            step={1}
            placeholder="e.g. 30"
            defaultValue={v("capacity")}
          />
        </Field>
      </div>

      <Field label="Location" htmlFor="location" error={errors.location}>
        <Input
          id="location"
          name="location"
          required
          placeholder="The Woodlands Methodist Church"
          defaultValue={v("location")}
        />
      </Field>

      <Field
        label="Address"
        htmlFor="location_address"
        hint="Optional — shown alongside the location for first-timers."
      >
        <Input
          id="location_address"
          name="location_address"
          placeholder="2200 Lake Woodlands Dr, The Woodlands, TX 77380"
          defaultValue={v("location_address")}
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-3">
        <Field label="Date" htmlFor="session_date" error={errors.session_date}>
          <Input
            id="session_date"
            name="session_date"
            type="date"
            required
            defaultValue={v("session_date")}
          />
        </Field>
        <Field label="Start time" htmlFor="start_time" error={errors.start_time}>
          <Input
            id="start_time"
            name="start_time"
            type="time"
            required
            defaultValue={v("start_time")}
          />
        </Field>
        <Field label="End time" htmlFor="end_time" error={errors.end_time}>
          <Input
            id="end_time"
            name="end_time"
            type="time"
            required
            defaultValue={v("end_time")}
          />
        </Field>
      </div>

      <Field
        label="Description"
        htmlFor="description"
        hint="Optional — surfaced on the public schedule and registration picker."
      >
        <Textarea
          id="description"
          name="description"
          rows={4}
          placeholder="What the event is, who it's for, what to bring."
          defaultValue={v("description")}
        />
      </Field>

      <div className="grid gap-3 rounded-lg border border-foreground/10 bg-secondary/40 p-4 sm:grid-cols-2">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="newcomer_friendly"
            defaultChecked={newcomerOn}
            className="mt-1 h-4 w-4 accent-vermillion"
          />
          <span>
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles size={12} aria-hidden /> Welcoming
            </span>
            <span className="block text-xs text-muted-foreground">
              First-timers can see this event on /classes and pick it on the
              registration form.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="accepting_rsvps"
            defaultChecked={acceptingOn}
            className="mt-1 h-4 w-4 accent-vermillion"
          />
          <span>
            <span className="block text-sm font-medium">Accepting RSVPs</span>
            <span className="block text-xs text-muted-foreground">
              Members can request a spot via /members/me/sessions until you
              close it on the detail page.
            </span>
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5"
        >
          <Save size={14} aria-hidden />
          {pending ? "Creating…" : "Create event"}
        </Button>
        <Link
          href="/admin/sessions"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
