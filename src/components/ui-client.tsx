"use client";

import clsx from "clsx";
import { useEffect, useState, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { PageTabs, type PageTabItem } from "./page-tabs";

export { PageTabs, type PageTabItem };

/* ---------- Scroll Lock Manager ---------- */
let activeOverlaysCount = 0;
let previousBodyOverflow = "";
let previousBodyPaddingRight = "";

function acquireScrollLock() {
  if (typeof window === "undefined") return;
  if (activeOverlaysCount === 0) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    previousBodyOverflow = document.body.style.overflow;
    previousBodyPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }
  activeOverlaysCount++;
}

function releaseScrollLock() {
  if (typeof window === "undefined") return;
  activeOverlaysCount = Math.max(0, activeOverlaysCount - 1);
  if (activeOverlaysCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
    document.body.style.paddingRight = previousBodyPaddingRight;
  }
}

/* ---------- Toasts ---------- */
export function toast(message: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("vos-toast", { detail: message }));
}
export function Toaster() {
  const [items, setItems] = useState<{ id: number; msg: string }[]>([]);
  useEffect(() => {
    const h = (e: Event) => {
      const msg = (e as CustomEvent<string>).detail;
      const id = Date.now() + Math.random();
      setItems((s) => [...s, { id, msg }]);
      setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 3200);
    };
    window.addEventListener("vos-toast", h);
    return () => window.removeEventListener("vos-toast", h);
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[10000] flex -translate-x-1/2 flex-col gap-2" role="status" aria-live="polite">
      {items.map((i) => (
        <div key={i.id} className="enter flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-fg shadow-lg">
          <Check size={16} strokeWidth={1.5} /> {i.msg}
        </div>
      ))}
    </div>
  );
}

/* ---------- Side Sheet / Drawer ---------- */
export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number | string;
  closeOnBackdropClick?: boolean;
}

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 540,
  closeOnBackdropClick = true,
}: SheetProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    acquireScrollLock();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      releaseScrollLock();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex h-dvh w-screen justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={typeof title === "string" ? titleId : undefined}
      onClick={closeOnBackdropClick ? onClose : undefined}
      onWheel={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <aside
        className="slide-in flex h-full w-full max-w-full flex-col border-l border-line bg-surface shadow-2xl animate-in slide-in-from-right duration-200"
        style={{ width: typeof width === "number" ? `${width}px` : width }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-6 py-4.5 bg-surface">
          <div className="min-w-0 pr-4">
            <h2 id={titleId} className="text-base font-semibold text-fg tracking-tight">
              {title}
            </h2>
            {subtitle && <p className="caption mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-lg p-1.5 text-muted hover:bg-subtle hover:text-fg transition-colors"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 focus:outline-none">
          {children}
        </div>

        {footer && (
          <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-line px-6 py-4 bg-surface">
            {footer}
          </footer>
        )}
      </aside>
    </div>,
    document.body
  );
}

export { Sheet as Drawer };

/* ---------- Modal ---------- */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number | string;
  closeOnBackdropClick?: boolean;
  hideHeader?: boolean;
  bodyClassName?: string;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 760,
  closeOnBackdropClick = true,
  hideHeader = false,
  bodyClassName,
  className,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    acquireScrollLock();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      releaseScrollLock();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex h-dvh w-screen items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-hidden animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      onClick={closeOnBackdropClick ? onClose : undefined}
      onWheel={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <div
        className={clsx(
          "relative flex flex-col w-full rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150",
          className
        )}
        style={{
          maxWidth: typeof width === "number" ? `${width}px` : width,
          maxHeight: "calc(100dvh - 48px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        {!hideHeader && title && (
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-6 py-4.5 bg-surface">
            <div className="min-w-0 pr-4">
              <h2 id={titleId} className="text-base font-semibold text-fg tracking-tight">
                {title}
              </h2>
              {description && (
                <p id={descId} className="caption mt-0.5 text-xs text-muted">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-lg p-1.5 text-muted hover:bg-subtle hover:text-fg transition-colors"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className={clsx("min-h-0 flex-1 overflow-y-auto px-6 py-5 focus:outline-none", bodyClassName)}>
          {children}
        </div>

        {/* Fixed Footer */}
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-line px-6 py-4 bg-surface">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ---------- Segmented control ---------- */
export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { id: T; label: ReactNode }[]; className?: string }) {
  return (
    <div className={clsx("inline-flex rounded-full bg-sunken p-0.5", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={clsx("rounded-full px-3.5 py-1 text-sm font-medium transition-colors", value === o.id ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function StateTabs<T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { id: T; label: ReactNode; count?: number | string; badge?: ReactNode; icon?: any }[];
  className?: string;
}) {
  return (
    <PageTabs
      items={items}
      value={value}
      onChange={onChange}
      className={clsx("mb-4", className)}
    />
  );
}

export function Chip({ active, onClick, children, disabled }: { active?: boolean; onClick?: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={clsx("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors", active ? "border-fg bg-primary text-primary-fg" : "border-line bg-surface text-fg hover:bg-sunken")}
    >
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={clsx("relative h-5 w-9 shrink-0 rounded-full transition-colors", checked ? "bg-primary" : "bg-line-strong")}>
      <span className={clsx("absolute top-0.5 h-4 w-4 rounded-full bg-primary-fg transition-all", checked ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}

export function Field({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-fg">{label}</span>
      {children}
      {hint && <span className="caption mt-1 block">{hint}</span>}
    </label>
  );
}

export function Counter({ value, min, max }: { value: number; min: number; max: number }) {
  const ok = value >= min && value <= max;
  return (
    <span className={clsx("text-xs tabular-nums", ok ? "text-success-fg" : value === 0 ? "text-muted" : "text-warning-fg")}>
      {value}/{max}
    </span>
  );
}
