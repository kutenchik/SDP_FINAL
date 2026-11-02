import { useEffect, useId, useRef, useState } from "react";
import type {
  ButtonHTMLAttributes,
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  Inbox,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { failure } from "../api/client";
import type { ApiFailure } from "../api/client";
import { label } from "../utils/format";
export function Button({
  children,
  variant = "primary",
  busy,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      {...props}
      disabled={busy || props.disabled}
      className={`btn btn-${variant} ${props.className || ""}`}
    >
      {busy ? <Loader2 className="spin" size={16} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
export function Badge({ value }: { value: string }) {
  return (
    <span className={`badge badge-${value.toLowerCase()}`}>
      <span aria-hidden="true" />
      {label(value)}
    </span>
  );
}
export function Avatar({ name, index = 0 }: { name: string; index?: number }) {
  return (
    <span className={`avatar avatar-${index % 5}`} aria-hidden="true">
      {name
        .split(/\s+/)
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()}
    </span>
  );
}
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Empty({
  title = "No records found",
  description,
  action,
}: {
  title?: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Inbox size={26} aria-hidden="true" />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Loading() {
  return (
    <div className="skeleton-grid" role="status" aria-label="Loading workspace">
      <span className="sr-only">Loading workspace…</span>
      {[1, 2, 3, 4, 5, 6].map((x) => (
        <div className="skeleton" key={x} />
      ))}
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle aria-hidden="true" />
      <div>
        <strong className="error-title">We couldn’t load this view</strong>
        <p>{message}</p>
      </div>
      <Button variant="secondary" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search-input">
      <Search size={17} aria-hidden="true" />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          className="icon-btn"
          aria-label="Clear search"
          onClick={() => onChange("")}
        >
          <X size={15} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
export function Field({
  label: caption,
  error,
  hint,
  children,
  required,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: (id: string) => ReactNode;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>
        {caption}
        {required && <span className="required"> *</span>}
      </label>
      {children(id)}
      {error ? (
        <p className="field-error" id={`${id}-hint`}>
          <AlertCircle size={13} aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
export function Input({
  label: caption,
  error,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
}) {
  return (
    <Field label={caption} error={error} hint={hint} required={props.required}>
      {(id) => (
        <input
          {...props}
          id={id}
          className="input"
          aria-invalid={!!error}
          aria-describedby={hint || error ? `${id}-hint` : undefined}
        />
      )}
    </Field>
  );
}
export function Textarea({
  label: caption,
  error,
  hint,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
}) {
  return (
    <Field label={caption} error={error} hint={hint} required={props.required}>
      {(id) => (
        <textarea
          {...props}
          id={id}
          className="input"
          rows={4}
          aria-invalid={!!error}
          aria-describedby={hint || error ? `${id}-hint` : undefined}
        />
      )}
    </Field>
  );
}
export function Select({
  label: caption,
  error,
  hint,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  hint?: string;
}) {
  return (
    <Field label={caption} error={error} hint={hint} required={props.required}>
      {(id) => (
        <div className="select-wrap">
          <select
            {...props}
            id={id}
            className="input"
            aria-invalid={!!error}
            aria-describedby={hint || error ? `${id}-hint` : undefined}
          >
            {children}
          </select>
          <ChevronDown size={15} aria-hidden="true" />
        </div>
      )}
    </Field>
  );
}
export function Modal({
  title,
  description,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        closeRef.current();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeRef.current();
      }}
      className={`modal ${wide ? "modal-wide" : ""}`}
    >
      <div className="modal-inner">
        <div className="modal-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <button
            className="icon-btn"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function useMutation(onSuccess: () => void | Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiFailure | null>(null);
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await onSuccess();
      return true;
    } catch (e) {
      setError(failure(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}
export function FormError({ error }: { error: ApiFailure | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [targets, setTargets] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!error) return;
    const form = ref.current?.closest("form");
    const next: Record<string, string> = {};
    for (const [key, message] of Object.entries(error.errors)) {
      const inlineError = [
        ...(form?.querySelectorAll(".field-error") || []),
      ].find((element) => element.textContent?.includes(message));
      const input = inlineError
        ?.closest(".field")
        ?.querySelector("input,select,textarea");
      if (input?.id) next[key] = input.id;
    }
    setTargets(next);
    ref.current?.focus();
  }, [error]);
  return error ? (
    <div ref={ref} className="form-error" role="alert" tabIndex={-1}>
      <AlertCircle size={18} aria-hidden="true" />
      <div>
        {error.message}
        {Object.keys(error.errors).length > 0 && (
          <ul>
            {Object.entries(error.errors).map(([k, v]) => (
              <li key={k}>
                {targets[k] ? (
                  <a
                    href={`#${targets[k]}`}
                    onClick={(event) => {
                      event.preventDefault();
                      document.getElementById(targets[k])?.focus();
                    }}
                  >
                    {label(k)}: {v}
                  </a>
                ) : (
                  <>
                    {label(k)}: {v}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  ) : null;
}
export function FormFooter({
  busy,
  onClose,
  label: caption = "Save changes",
}: {
  busy: boolean;
  onClose: () => void;
  label?: string;
}) {
  return (
    <div className="form-footer">
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" busy={busy}>
        {!busy && <Check size={16} aria-hidden="true" />}
        {caption}
      </Button>
    </div>
  );
}
export function SubmitForm({
  children,
  onSubmit,
}: {
  children: ReactNode;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {children}
    </form>
  );
}
export function TextLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-link" onClick={onClick}>
      {children}
      <ArrowRight size={15} aria-hidden="true" />
    </button>
  );
}
