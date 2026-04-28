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
          "rounded-md border bg-background px-3.5 py-2.5 text-base",
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
          "rounded-md border bg-background px-3.5 py-2.5 text-base",
          "border-foreground/20 focus:border-vermillion",
          "transition-colors resize-y min-h-20",
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
          "rounded-md border bg-background px-3.5 py-2.5 text-base",
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
              "flex items-center gap-3 rounded-md border border-foreground/15 bg-background px-3.5 py-2.5 cursor-pointer",
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
              className="h-4 w-4 accent-vermillion"
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
  defaultChecked,
  className,
  children,
}: BaseProps & {
  defaultChecked?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          id={name}
          name={name}
          required={required}
          defaultChecked={defaultChecked}
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
    <section>
      <header className="mb-5 flex items-baseline gap-3 flex-wrap">
        <span className="font-mono text-xs tabular-nums text-vermillion">
          {String(number).padStart(2, "0")} / 06
        </span>
        <h2 className="font-display text-2xl tracking-tight">{title}</h2>
        {description && (
          <p className="basis-full mt-1 text-sm text-foreground/65 leading-relaxed">
            {description}
          </p>
        )}
      </header>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}
