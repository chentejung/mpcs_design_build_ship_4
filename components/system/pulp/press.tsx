"use client";
// Pulp's print finish, after the newsstand covers, one-sheets and pop-art panels on the American Comics board
// (Mood Board 02): flat inks under heavy Ink keylines, shading in dot screens, colour plates printed a hair out of
// register with the line art, and cheap paper that loses ink in specks. The drawing kit is one file per picture:
// space-fleet.tsx (26), captain-aero.tsx (25), weird-space-tales.tsx (03), into-the-unknown.tsx (29), the-mask.tsx (08),
// pow.tsx (16), look.tsx (17), ring-ring.tsx (13) and krakoom.tsx (05); cover.tsx sets them together, and app/system.css
// gives the controls the same extrusions, bulbs and screens.
import { useId } from "react";
import { colors } from "@/lib/pulp";

export const c = colors;
export const display = { fontFamily: "var(--ds-display-font)" };
export const poster = { fontFamily: "var(--ds-label-font)" };
export const useSvgId = () => useId().replace(/:/g, "");
export const f = (n: number) => n.toFixed(1);

// Cheap paper under worn plates: edges wander by `rough` (viewBox units) and the ink drops out in specks where the
// paper's fibres didn't take it (`specks` 0 none, 1 a lot). `scale` sizes the grain for the drawing's viewBox.
export function Newsprint({ id, rough = 0.8, specks = 0.4, scale = 1, seed = 4 }: { id: string; rough?: number; specks?: number; scale?: number; seed?: number }) {
  const cut = 0.8 - specks * 0.07;
  return (
    <filter id={id} x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency={0.04 / scale} numOctaves="2" seed={seed} result="warp" />
      <feDisplacementMap in="SourceGraphic" in2="warp" scale={rough} xChannelSelector="R" yChannelSelector="G" result="rough" />
      <feTurbulence type="fractalNoise" baseFrequency={0.9 / scale} numOctaves="2" seed={seed + 5} result="grain" />
      <feColorMatrix in="grain" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -24 0 0 0 ${(24 * cut).toFixed(2)}`} result="ink" />
      <feComposite in="rough" in2="ink" operator="in" />
    </filter>
  );
}

// A dot screen: `r` the dot, `gap` the pitch, set at a screen angle as the colour plates were.
export function Screen({ id, color, r = 1, gap = 4, angle = 45 }: { id: string; color: string; r?: number; gap?: number; angle?: number }) {
  return (
    <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
      <circle cx={gap / 2} cy={gap / 2} r={r} fill={color} />
    </pattern>
  );
}

// Tapered pen cuts rather than a uniform vector stripe. Use inside a silhouette's clip.
export function Engraving({ id, gap = 2.4, color = c.ink }: { id: string; gap?: number; color?: string }) {
  return (
    <pattern id={id} width={gap} height={gap * 4} patternUnits="userSpaceOnUse" patternTransform="rotate(-32)">
      <path d={`M0 0L${gap * 0.34} ${gap * 1.7}L0 ${gap * 4}Z`} fill={color} />
      <path d={`M${gap * 0.62} ${gap * 2.1}l${gap * 0.16} ${gap * 0.35}l${-gap * 0.16} ${gap * 0.45}Z`} fill={color} />
    </pattern>
  );
}

// Ink keylines: the comic inker's line, heavy and round-jointed.
export const ink = (w: number) => ({ stroke: c.ink, strokeWidth: w, strokeLinejoin: "round" as const, strokeLinecap: "round" as const });

// A four-point sparkle, as the covers star their skies.
export const sparkle = (x: number, y: number, r: number) =>
  `M${f(x)} ${f(y - r)}Q${f(x + r * 0.16)} ${f(y - r * 0.16)} ${f(x + r)} ${f(y)}Q${f(x + r * 0.16)} ${f(y + r * 0.16)} ${f(x)} ${f(y + r)}Q${f(x - r * 0.16)} ${f(y + r * 0.16)} ${f(x - r)} ${f(y)}Q${f(x - r * 0.16)} ${f(y - r * 0.16)} ${f(x)} ${f(y - r)}Z`;

// A ribbon along a cubic curve from a to b (controls c1, c2), `w0` wide at a and `w1` at b: the rockets' looping
// trails and the cover's scroll banners.
export function ribbon(a: [number, number], c1: [number, number], c2: [number, number], b: [number, number], w0: number, w1: number, n = 24) {
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    const x = u ** 3 * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * b[0];
    const y = u ** 3 * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * b[1];
    const dx = 3 * u * u * (c1[0] - a[0]) + 6 * u * t * (c2[0] - c1[0]) + 3 * t * t * (b[0] - c2[0]);
    const dy = 3 * u * u * (c1[1] - a[1]) + 6 * u * t * (c2[1] - c1[1]) + 3 * t * t * (b[1] - c2[1]);
    const len = Math.hypot(dx, dy) || 1;
    const h = (w0 + (w1 - w0) * Math.sin((t * Math.PI) / 2)) / 2;
    left.push(`${f(x - (dy / len) * h)} ${f(y + (dx / len) * h)}`);
    right.push(`${f(x + (dy / len) * h)} ${f(y - (dx / len) * h)}`);
  }
  return `M${left.join("L")}L${right.reverse().join("L")}Z`;
}

// Masthead lettering, extruded as the covers letter it: a `face` outlined in Ink, standing on a `side` block `depth`
// (a share of the size) deep toward the lower right, the whole block outlined again. `tone` splits the face
// two-tone across the middle, as American Psycho's AMERICAN is. `width` fits the word to a measure whatever the font's
// metrics, so a cover's layout never shifts.
export function Lettering({ x, y, size, text, width, anchor = "start", face = c.mustard, side = c.red, depth = 0.08, tone, rotate = 0, spacing = 0 }: {
  x: number; y: number; size: number; text: string; width?: number; anchor?: "start" | "middle" | "end";
  face?: string; side?: string; depth?: number; tone?: [string, string]; rotate?: number; spacing?: number;
}) {
  const id = useSvgId();
  const d = size * depth;
  const steps = Math.max(3, Math.round(d / 1.2));
  const line = Math.max(1, size * 0.045);
  const copy = (dx: number, props: React.SVGProps<SVGTextElement>, key: string | number) => (
    <text key={key} x={x + dx} y={y + dx} {...(width ? { textLength: width, lengthAdjust: "spacingAndGlyphs" } : {})} {...props}>{text}</text>
  );
  const offsets = Array.from({ length: steps + 1 }, (_, i) => (d * i) / steps);
  return (
    <g style={display} fontSize={size} textAnchor={anchor} letterSpacing={spacing} transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}>
      {tone && (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.54" stopColor={tone[0]} />
            <stop offset="0.54" stopColor={tone[1]} />
          </linearGradient>
        </defs>
      )}
      {offsets.map((o, i) => copy(o, { fill: c.ink, stroke: c.ink, strokeWidth: line * 2.6, strokeLinejoin: "round" }, `o${i}`))}
      {offsets.slice(1).map((o, i) => copy(o, { fill: side, stroke: side, strokeWidth: line * 0.6 }, `s${i}`))}
      {copy(0, { fill: tone ? `url(#${id})` : face, stroke: c.ink, strokeWidth: line, strokeLinejoin: "round", paintOrder: "stroke" }, "face")}
    </g>
  );
}
