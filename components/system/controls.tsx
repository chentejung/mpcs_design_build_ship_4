// Pulp controls, styled by app/system.css. `state` freezes hover, focus or pressed, as the CSS supports.
import { categoryLabel, type Category } from "@/lib/categories";
import { PulpGenreIcon } from "./pulp/genre";
import { CheckIcon, Icon, type IconName } from "./icons";

export type FrozenState = "hover" | "focus" | "pressed";
type Variant = "primary" | "secondary";

export const buttonClass = (variant?: Variant, block = false) =>
  ["ds-btn", variant && `ds-btn--${variant}`, block && "ds-btn--block"].filter(Boolean).join(" ");

// The icon slot: a Pulp balloon or blast (icons.tsx).
export const ButtonIcon = ({ name }: { name: IconName }) => <span aria-hidden className="ds-btn-icon"><Icon name={name} /></span>;

export function Button({ variant, block, state, icon, className = "", children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  block?: boolean;
  state?: FrozenState;
  icon?: IconName;
}) {
  return (
    <button type="button" data-state={state} className={`${buttonClass(variant, block)} ${className}`} {...props}>
      {icon && <ButtonIcon name={icon} />}
      {children}
    </button>
  );
}

// `genre` heads the chip with its Category's pop-art panel.
export function Chip({ label, count, state, genre, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  count?: number;
  state?: FrozenState;
  genre?: Category | "all";
}) {
  return (
    <button type="button" data-state={state} className="ds-chip" {...props}>
      {genre && <PulpGenreIcon id={genre} className="ds-genre-icon" />}
      {label}
      {count !== undefined && <span aria-hidden className="ds-chip-count">{count}</span>}
    </button>
  );
}

export function CategoryBadge({ category, className = "" }: { category: Category; className?: string }) {
  return (
    <span className={`ds-badge ${className}`} style={{ "--cat-bg": `var(--ds-cat-${category}-bg)`, "--cat-fg": `var(--ds-cat-${category}-fg)` } as React.CSSProperties}>
      <PulpGenreIcon id={category} className="ds-genre-icon" />
      {categoryLabel[category]}
    </span>
  );
}

// Keyed by its number, so a new count re-mounts and plays its entrance (the issue number pops).
export const Count = ({ n }: { n: number }) => <span key={n} className="ds-count">{n}</span>;

export function TextInput({ state, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { state?: FrozenState }) {
  return <input data-state={state} className="ds-input" {...props} />;
}

export function Select({ state, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { state?: FrozenState }) {
  return (
    <span className="ds-select-wrap">
      <select data-state={state} className="ds-select" {...props}>{children}</select>
    </span>
  );
}

export function Check({ label, type = "checkbox", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="ds-check">
      <input type={type} {...props} />
      <span aria-hidden className="ds-box">{type === "checkbox" && <CheckIcon />}</span>
      <span>{label}</span>
    </label>
  );
}

export function Toggle({ label, checked, onToggle }: { label: string; checked: boolean; onToggle?: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={onToggle} className="ds-toggle">
      <span aria-hidden className="ds-toggle-track" />
      <span>{label}</span>
    </button>
  );
}

// The toast's caption. It sits inside a live region (role status or alert) that is on the page before it appears,
// so screen readers announce it.
export function Toast({ children, action, tone = "notice" }: { children: React.ReactNode; action?: React.ReactNode; tone?: "notice" | "error" }) {
  return (
    <div data-tone={tone} className="ds-toast ds-body">
      <span>{children}</span>
      {action}
    </div>
  );
}
