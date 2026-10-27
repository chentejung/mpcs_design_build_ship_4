// The Pulp Design System, carried over from Week 2: the American Comics mood board's palette, how Pulp maps it to
// color roles (Muted and Border are Text blended into Background, resolved to solid hex so their contrast can be
// checked), type roles and shapes. systemStyle() turns it into --ds-* CSS variables for app/system.css and runs
// checkSystem() first, so the build fails if a text pairing misses its contrast target.
import type { Category } from "./categories";

type Ink = string; // a palette swatch key, or "white"

export type Swatch = { key: string; name: string; hex: string };

// Six colors chosen in Week 2 as the set that best represents the American Comics board's pictures.
export const palette: Swatch[] = [
  { key: "red", name: "Hero Red", hex: "#dc2a24" },
  { key: "ink", name: "Ink Black", hex: "#0d0c0d" },
  { key: "newsprint", name: "Newsprint", hex: "#f2eddd" },
  { key: "peach", name: "Ben-Day Peach", hex: "#ebba8a" },
  { key: "mustard", name: "Golden Age Mustard", hex: "#d3bc2c" },
  { key: "sepia", name: "Aged Sepia", hex: "#5b4b3c" },
];

export const colors = Object.fromEntries(palette.map((p) => [p.key, p.hex])) as Record<string, string>;

export type TypeRole = "Display" | "Heading" | "Body" | "Label" | "Meta" | "Native" | "Fine print";
export type FontRef = { family: string; variable: string }; // variable is set by app/fonts.ts
export type TypeSpec = { font: FontRef; size: number; weight: number; tracking?: number; upper?: boolean };
export type ShapePart = "control" | "card" | "poster" | "badge" | "panel";

export type DesignSystem = {
  id: string;
  name: string;
  colors: {
    background: Ink;
    surface: Ink;
    text: Ink;
    accent: Ink;
    onAccent: Ink;
    selected: Ink;
    onSelected: Ink;
    focus: Ink;
    muted: number; // share of Text blended into Background
    border: number; // share of Text blended into Background
    onSurface?: Ink; // text on a dark Surface (default: Text)
    mutedOnSurface?: number; // share of onSurface blended into a dark Surface (default: Muted)
    categories: Record<Category, Ink>; // badge tint per Category
  };
  type: Record<TypeRole, TypeSpec>;
  shape: { radius: Record<ShapePart, number>; border: { control: number; card: number } };
};

const font = {
  fugaz: { family: "Fugaz One", variable: "--font-fugaz" },
  anton: { family: "Anton", variable: "--font-anton" },
  robotoSlab: { family: "Roboto Slab", variable: "--font-roboto-slab" },
  robotoCondensed: { family: "Roboto Condensed", variable: "--font-roboto-condensed" },
  notoSansKr: { family: "Noto Sans KR", variable: "--font-noto-sans-kr" },
} satisfies Record<string, FontRef>;

// Ben-Day Peach and Golden Age Mustard never carry text on Newsprint (1.50:1 and 1.63:1): they are grounds under
// Ink, or Mustard lettering on Ink, as the masthead's yellow sits on Space Fleet's night.
export const pulp: DesignSystem = {
  id: "pulp",
  name: "Pulp",
  colors: {
    background: "newsprint",
    surface: "sepia",
    text: "ink",
    accent: "red",
    onAccent: "white",
    selected: "ink",
    onSelected: "mustard",
    focus: "ink",
    muted: 0.74,
    border: 0.85,
    onSurface: "newsprint",
    mutedOnSurface: 0.8,
    categories: {
      thriller: "sepia", comedy: "mustard", animation: "peach", action: "red", "science-fiction": "ink", romance: "red", horror: "ink",
      adventure: "mustard", crime: "sepia", documentary: "peach", drama: "red", family: "mustard", fantasy: "ink",
      history: "peach", music: "red", mystery: "sepia", "tv-movie": "mustard", war: "sepia", western: "peach",
    },
  },
  type: {
    Display: { font: font.fugaz, size: 64, weight: 400 },
    Heading: { font: font.anton, size: 20, weight: 400, tracking: 0.01 }, // condensed, so long titles keep to 2 lines at 168px
    Body: { font: font.robotoSlab, size: 15, weight: 400 },
    Label: { font: font.anton, size: 15, weight: 400, tracking: 0.07, upper: true },
    Meta: { font: font.robotoSlab, size: 12, weight: 700 },
    Native: { font: font.notoSansKr, size: 14, weight: 700 },
    "Fine print": { font: font.robotoCondensed, size: 11, weight: 400 },
  },
  shape: {
    radius: { control: 0, card: 0, poster: 0, badge: 0, panel: 0 },
    border: { control: 3, card: 3 },
  },
};

export const SCRIM_OPACITY = 0.92;

// ----- Colors -----

const hex = (ink: Ink) => {
  if (ink === "white") return "#ffffff";
  const swatch = palette.find((p) => p.key === ink);
  if (!swatch) throw new Error(`unknown swatch "${ink}"`);
  return swatch.hex;
};

// Mix two colors in sRGB, like CSS color-mix(in srgb, a t, b).
export function mix(a: string, b: string, t: number) {
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2].map((i) => Math.round(ch(a, i) * t + ch(b, i) * (1 - t)).toString(16).padStart(2, "0")).join("")}`;
}

// WCAG 2 contrast ratio.
export function contrast(a: string, b: string) {
  const lum = (h: string) => {
    const [r, g, bl] = [0, 1, 2].map((i) => {
      const v = parseInt(h.slice(1 + i * 2, 3 + i * 2), 16) / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export type ResolvedColors = {
  background: string; surface: string; text: string; muted: string; border: string; accent: string; onAccent: string;
  selected: string; onSelected: string; focus: string; scrim: string; error: string; onSurface: string; mutedOnSurface: string;
};

export function resolveColors(s: DesignSystem): ResolvedColors {
  const c = s.colors;
  const background = hex(c.background);
  const surface = hex(c.surface);
  const text = hex(c.text);
  const muted = mix(text, background, c.muted);
  const onSurface = c.onSurface ? hex(c.onSurface) : text;
  return {
    background, surface, text, muted,
    border: mix(text, background, c.border),
    accent: hex(c.accent),
    onAccent: hex(c.onAccent),
    selected: hex(c.selected),
    onSelected: hex(c.onSelected),
    focus: hex(c.focus),
    scrim: background,
    error: mix(hex(c.accent), text, 0.8), // Accent deepened with Text, to read as small bold type
    onSurface,
    mutedOnSurface: c.mutedOnSurface ? mix(onSurface, surface, c.mutedOnSurface) : muted,
  };
}

// Badge tint per Category, with the text color that sits on it: On-Accent / text on Selected for those tints,
// otherwise whichever of Text and Background reads better.
export function categoryColors(s: DesignSystem, category: Category) {
  const r = resolveColors(s);
  const ink = s.colors.categories[category];
  const bg = hex(ink);
  if (ink === s.colors.accent) return { bg, fg: r.onAccent };
  if (ink === s.colors.selected) return { bg, fg: r.onSelected };
  return { bg, fg: contrast(r.text, bg) >= contrast(r.background, bg) ? r.text : r.background };
}

export type ContrastCheck = { pair: string; ratio: number; min: number };

// The pairings the build checks: 4.5:1 for text, 3:1 for Accent as large text and for state changes.
export function contrastChecks(s: DesignSystem): ContrastCheck[] {
  const r = resolveColors(s);
  const checks: ContrastCheck[] = [
    { pair: "Text on Background", ratio: contrast(r.text, r.background), min: 4.5 },
    { pair: "Muted on Background", ratio: contrast(r.muted, r.background), min: 4.5 },
    { pair: "Text on Surface", ratio: contrast(r.onSurface, r.surface), min: 4.5 },
    { pair: "Muted on Surface", ratio: contrast(r.mutedOnSurface, r.surface), min: 4.5 },
    { pair: "On-Accent on Accent", ratio: contrast(r.onAccent, r.accent), min: 4.5 },
    { pair: "Text on Selected", ratio: contrast(r.onSelected, r.selected), min: 4.5 },
    { pair: "Accent as large text on Background", ratio: contrast(r.accent, r.background), min: 3 },
    { pair: "Selected against Background", ratio: contrast(r.selected, r.background), min: 3 },
    { pair: "Focus ring against Background", ratio: contrast(r.focus, r.background), min: 3 },
    { pair: "Error on Background", ratio: contrast(r.error, r.background), min: 4.5 },
  ];
  for (const category of Object.keys(s.colors.categories) as Category[]) {
    const { bg, fg } = categoryColors(s, category);
    checks.push({ pair: `${category} badge text`, ratio: contrast(fg, bg), min: 4.5 });
  }
  return checks;
}

export function checkSystem(s: DesignSystem) {
  const failing = contrastChecks(s).filter((c) => c.ratio < c.min);
  if (failing.length)
    throw new Error(`${s.name}: contrast too low:\n- ${failing.map((c) => `${c.pair} is ${c.ratio.toFixed(2)}:1, needs ${c.min}:1`).join("\n- ")}`);
}

// CSS variables that theme components/system.
export function systemStyle(s: DesignSystem): React.CSSProperties {
  checkSystem(s);
  const r = resolveColors(s);
  const vars: Record<string, string | number> = {
    "--ds-bg": r.background, "--ds-surface": r.surface, "--ds-text": r.text, "--ds-muted": r.muted, "--ds-border": r.border,
    "--ds-accent": r.accent, "--ds-on-accent": r.onAccent, "--ds-selected": r.selected, "--ds-on-selected": r.onSelected,
    "--ds-focus": r.focus, "--ds-scrim": `color-mix(in srgb, ${r.scrim} ${SCRIM_OPACITY * 100}%, transparent)`,
    "--ds-error": r.error, "--ds-on-surface": r.onSurface, "--ds-muted-on-surface": r.mutedOnSurface,
    "--ds-control-border": `${s.shape.border.control}px`, "--ds-card-border": `${s.shape.border.card}px`,
  };
  for (const p of palette) vars[`--ds-swatch-${p.key}`] = p.hex; // ornaments: marquee bulbs, blurbs
  for (const category of Object.keys(s.colors.categories) as Category[]) {
    const { bg, fg } = categoryColors(s, category);
    vars[`--ds-cat-${category}-bg`] = bg;
    vars[`--ds-cat-${category}-fg`] = fg;
  }
  for (const [part, px] of Object.entries(s.shape.radius)) vars[`--ds-radius-${part}`] = `${px}px`;
  for (const [role, t] of Object.entries(s.type)) {
    const key = role.toLowerCase().replace(" ", "-");
    // Inter catches Latin the display fonts lack (e.g. ō); Noto Sans KR / Serif TC catch Hangul and Han in original titles.
    vars[`--ds-${key}-font`] = `var(${t.font.variable}), var(--font-inter), var(--font-noto-sans-kr), var(--font-noto-serif-tc), sans-serif`;
    vars[`--ds-${key}-size`] = `${t.size}px`;
    vars[`--ds-${key}-weight`] = t.weight;
    vars[`--ds-${key}-tracking`] = `${t.tracking ?? 0}em`;
    vars[`--ds-${key}-case`] = t.upper ? "uppercase" : "none";
  }
  return vars as React.CSSProperties;
}
