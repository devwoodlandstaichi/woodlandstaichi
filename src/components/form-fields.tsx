import { cn } from "@/lib/utils";

type BaseProps = {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  defaultValue?: string;
  className?: string;
};

export function Field({
  name,
  label,
  hint,
  required,
  error,
  type = "text",
  defaultValue,
  inputMode,
  autoComplete,
  pattern,
  placeholder,
  className,
}: BaseProps & {
  type?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal";
  autoComplete?: string;
  pattern?: string;
  placeholder?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className="text-sm font-medium">
        {label}{" "}
        {required && (
          <span aria-hidden className="text-vermillion">
            *
          </span>
        )}
      </label>
      {hint && <p className="text-xs text-foreground/60">{hint}</p>}
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        inputMode={inputMode}
        autoComplete={autoComplete}
        pattern={pattern}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={cn(
          "rounded-md border bg-background px-4 py-3 text-base",
          "border-foreground/20 focus:border-vermillion",
          "transition-colors",
          error && "border-vermillion bg-vermillion/5",
        )}
      />
      {error && (
        <p
          id={`${name}-error`}
          role="alert"
          className="text-sm text-vermillion"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function Textarea({
  name,
  label,
  hint,
  required,
  error,
  defaultValue,
  rows = 3,
  className,
}: BaseProps & { rows?: number }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className="text-sm font-medium">
        {label}{" "}
        {required && (
          <span aria-hidden className="text-vermillion">
            *
          </span>
        )}
      </label>
      {hint && <p className="text-xs text-foreground/60">{hint}</p>}
      <textarea
        id={name}
        name={name}
        rows={rows}
        required={required}
        defaultValue={defaultValue}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={cn(
          "rounded-md border bg-background px-4 py-3 text-base",
          "border-foreground/20 focus:border-vermillion",
          "transition-colors resize-y min-h-24",
          error && "border-vermillion bg-vermillion/5",
        )}
      />
      {error && (
        <p
          id={`${name}-error`}
          role="alert"
          className="text-sm text-vermillion"
        >
          {error}
        </p>
      )}
    </div>
  );
}

type Option = { value: string; label: string };

export function Select({
  name,
  label,
  hint,
  required,
  error,
  options,
  defaultValue,
  placeholder = "Choose one…",
  className,
}: BaseProps & { options: readonly Option[]; placeholder?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className="text-sm font-medium">
        {label}{" "}
        {required && (
          <span aria-hidden className="text-vermillion">
            *
          </span>
        )}
      </label>
      {hint && <p className="text-xs text-foreground/60">{hint}</p>}
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={cn(
          "rounded-md border bg-background px-4 py-3 text-base",
          "border-foreground/20 focus:border-vermillion",
          "transition-colors",
          error && "border-vermillion bg-vermillion/5",
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p
          id={`${name}-error`}
          role="alert"
          className="text-sm text-vermillion"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function RadioGroup({
  name,
  label,
  hint,
  required,
  error,
  options,
  defaultValue,
  className,
}: BaseProps & { options: readonly Option[] }) {
  return (
    <fieldset
      className={cn("flex flex-col gap-3", className)}
      aria-invalid={!!error}
      aria-describedby={error ? `${name}-error` : undefined}
    >
      <legend className="text-sm font-medium">
        {label}{" "}
        {required && (
          <span aria-hidden className="text-vermillion">
            *
          </span>
        )}
      </legend>
      {hint && <p className="text-xs text-foreground/60 -mt-1">{hint}</p>}
      <div className="flex flex-col gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "flex items-start gap-3 rounded-md border border-foreground/15 bg-background p-4 cursor-pointer",
              "hover:border-vermillion/40 transition-colors",
              error && "border-vermillion/40",
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              defaultChecked={defaultValue === o.value}
              required={required}
              className="mt-1 h-5 w-5 accent-vermillion"
            />
            <span className="text-base">{o.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p
          id={`${name}-error`}
          role="alert"
          className="text-sm text-vermillion"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function Checkbox({
  name,
  label,
  hint,
  required,
  error,
  className,
  children,
}: BaseProps & { children?: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          id={name}
          name={name}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          className="mt-1 h-5 w-5 accent-vermillion"
        />
        <span className="text-base">
          {label}{" "}
          {required && (
            <span aria-hidden className="text-vermillion">
              *
            </span>
          )}
        </span>
      </label>
      {hint && <p className="text-xs text-foreground/60 ml-8">{hint}</p>}
      {children && <div className="ml-8">{children}</div>}
      {error && (
        <p
          id={`${name}-error`}
          role="alert"
          className="text-sm text-vermillion ml-8"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-12 gap-x-6 gap-y-6 border-t border-foreground/10 pt-12 first:border-0 first:pt-0">
      <div className="col-span-12 md:col-span-4">
        <p className="font-mono text-xs tabular-nums text-vermillion">
          {String(number).padStart(2, "0")} / 06
        </p>
        <h2 className="mt-2 font-display text-3xl tracking-tight">{title}</h2>
        {description && (
          <p className="mt-3 text-sm text-foreground/65 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="col-span-12 md:col-span-8 grid gap-5">{children}</div>
    </section>
  );
}
