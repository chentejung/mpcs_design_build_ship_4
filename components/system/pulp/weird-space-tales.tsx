"use client";
// Pulp's drawing kit after Weird Space Tales on the American Comics board (picture 03): the great banded planet with
// its tilted ring, and the flying saucer gliding past it, its rim lit and a beam beneath. The planet is the hero's
// centrepiece and, ringed in Hero Red, The Bijou's brand mark; the saucer is the Sci-Fi pictogram.
import { c, Engraving, ink, Newsprint, Screen, sparkle, useSvgId } from "./press";
import { illustrationPath } from "./illustrations";

// A planet at (cx, cy) of radius r, its ring tilted `tilt` degrees: the far half of the ring behind the globe, the near
// half in front. Bands of `band` cross a `body` globe, shaded in a Sepia dot screen away from the light.
export function RingedPlanet({ cx, cy, r, tilt = -16, body = c.peach, band = c.red, ring = c.newsprint, w = 2.4 }: {
  cx: number; cy: number; r: number; tilt?: number; body?: string; band?: string; ring?: string; w?: number;
}) {
  const id = useSvgId();
  const annulus = (rx: number, ry: number, ix: number, iy: number) =>
    `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}ZM${cx - ix} ${cy}A${ix} ${iy} 0 1 1 ${cx + ix} ${cy}A${ix} ${iy} 0 1 1 ${cx - ix} ${cy}Z`;
  const ringPath = annulus(r * 1.95, r * 0.5, r * 1.42, r * 0.3);
  const groove = `M${cx - r * 1.7} ${cy}A${r * 1.7} ${r * 0.41} 0 1 0 ${cx + r * 1.7} ${cy}A${r * 1.7} ${r * 0.41} 0 1 0 ${cx - r * 1.7} ${cy}`;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-g`}><circle cx={cx} cy={cy} r={r} /></clipPath>
        <clipPath id={`${id}-near`}><rect x={cx - r * 2.2} y={cy} width={r * 4.4} height={r} /></clipPath>
        <Screen id={`${id}-shade`} color={c.sepia} r={Math.max(0.5, r * 0.03)} gap={Math.max(2, r * 0.08)} angle={45} />
        <Engraving id={`${id}-hatch`} gap={r * 0.065} />
      </defs>
      <g transform={`rotate(${tilt} ${cx} ${cy})`}>
        <path d={ringPath} fill={ring} fillRule="evenodd" {...ink(w)} />
        <path d={groove} fill="none" stroke={c.sepia} strokeWidth={w * 0.6} opacity="0.7" />
      </g>
      <circle cx={cx} cy={cy} r={r} fill={body} />
      <g clipPath={`url(#${id}-g)`}>
        <g transform={`rotate(${tilt} ${cx} ${cy})`} fill={band}>
          <path d={`M${cx - r} ${cy - r * 0.42}C${cx - r * 0.3} ${cy - r * 0.5} ${cx + r * 0.3} ${cy - r * 0.36} ${cx + r} ${cy - r * 0.48}V${cy - r * 0.3}C${cx + r * 0.2} ${cy - r * 0.2} ${cx - r * 0.4} ${cy - r * 0.32} ${cx - r} ${cy - r * 0.24}Z`} />
          <path d={`M${cx - r} ${cy + r * 0.04}C${cx - r * 0.4} ${cy - r * 0.06} ${cx + r * 0.4} ${cy + r * 0.12} ${cx + r} ${cy}V${cy + r * 0.3}C${cx + r * 0.3} ${cy + r * 0.4} ${cx - r * 0.3} ${cy + r * 0.24} ${cx - r} ${cy + r * 0.34}Z`} />
          <path d={`M${cx - r} ${cy + r * 0.6}C${cx - r * 0.3} ${cy + r * 0.52} ${cx + r * 0.3} ${cy + r * 0.7} ${cx + r} ${cy + r * 0.6}V${cy + r * 0.72}C${cx + r * 0.3} ${cy + r * 0.82} ${cx - r * 0.3} ${cy + r * 0.66} ${cx - r} ${cy + r * 0.74}Z`} opacity="0.8" />
        </g>
        <circle cx={cx + r * 0.42} cy={cy + r * 0.42} r={r * 1.02} fill={`url(#${id}-shade)`} />
        <path d={`M${cx - r * 0.3} ${cy + r}Q${cx + r * 1.1} ${cy + r * 0.1} ${cx + r * 0.5} ${cy - r}H${cx + r * 1.2}V${cy + r * 1.2}Z`} fill={`url(#${id}-hatch)`} />
        <path d={`M${cx - r * 0.62} ${cy - r * 0.5}A${r * 0.8} ${r * 0.8} 0 0 1 ${cx - r * 0.08} ${cy - r * 0.84}`} fill="none" stroke={c.newsprint} strokeWidth={r * 0.09} strokeLinecap="round" opacity="0.85" />
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" {...ink(w)} />
      <g transform={`rotate(${tilt} ${cx} ${cy})`} clipPath={`url(#${id}-near)`}>
        <path d={ringPath} fill={ring} fillRule="evenodd" {...ink(w)} />
        <path d={groove} fill="none" stroke={c.sepia} strokeWidth={w * 0.6} opacity="0.7" />
      </g>
    </g>
  );
}

// The flying saucer at (x, y), `w` across: a Newsprint disc under a Peach dome, its rim lit in Mustard, and a beam.
export function Saucer({ x, y, w, beam = true, k = 1 }: { x: number; y: number; w: number; beam?: boolean; k?: number }) {
  const h = w * 0.3;
  return (
    <g>
      {beam && <path d={`M${x - w * 0.16} ${y + h * 0.3}L${x - w * 0.42} ${y + w * 0.95}H${x + w * 0.42}L${x + w * 0.16} ${y + h * 0.3}Z`} fill={c.mustard} opacity="0.55" />}
      <path d={`M${x - w * 0.24} ${y - h * 0.12}C${x - w * 0.22} ${y - h * 1.5} ${x + w * 0.22} ${y - h * 1.5} ${x + w * 0.24} ${y - h * 0.12}Z`} fill={c.peach} {...ink(1.8 * k)} />
      <path d={`M${x} ${y - h * 1.05}Q${x + w * 0.28} ${y - h * 1.2} ${x + w * 0.24} ${y}H${x - w * 0.05}Q${x + w * 0.18} ${y - h * 0.5} ${x} ${y - h * 1.05}Z`} fill={c.ink} />
      <path d={`M${x - w * 0.1} ${y - h * 0.9}C${x - w * 0.04} ${y - h * 1.2} ${x + w * 0.04} ${y - h * 1.22} ${x + w * 0.08} ${y - h * 1.1}`} fill="none" stroke={c.newsprint} strokeWidth={1.6 * k} strokeLinecap="round" />
      <ellipse cx={x} cy={y} rx={w / 2} ry={h / 2} fill={c.newsprint} {...ink(1.8 * k)} />
      {[-0.38, -0.28, 0.28, 0.38].map(u => <path key={u} d={`M${x + u * w} ${y - h * 0.2}l${u * w * 0.16} ${h * 0.34}`} {...ink(k)} />)}
      <path d={`M${x - w / 2} ${y}C${x - w * 0.3} ${y + h * 0.62} ${x + w * 0.3} ${y + h * 0.62} ${x + w / 2} ${y}`} fill={c.sepia} {...ink(1.8 * k)} />
      {[-0.32, -0.16, 0, 0.16, 0.32].map((u) => (
        <circle key={u} cx={x + u * w} cy={y + h * 0.08 + Math.abs(u) * -h * 0.12} r={w * 0.035} fill={c.mustard} />
      ))}
    </g>
  );
}

// The Sci-Fi pictogram: the saucer over a starry Ink ground, its beam reaching down.
export function SaucerGlyph() {
  return (
    <g>
      <rect width="24" height="24" fill={c.ink} />
      {[[4, 5, 1.6], [19.5, 3.5, 1.2], [20, 17, 1.4], [3, 15, 1]].map(([x, y, r]) => <path key={`${x}-${y}`} d={sparkle(x, y, r)} fill={c.newsprint} />)}
      <Saucer x={12} y={10.5} w={17} k={0.55} />
    </g>
  );
}

// The Bijou's brand mark: a Mustard planet ringed in Hero Red with two sparkles, on its own little night sky.
export function PlanetMark({ className = "" }: { className?: string }) {
  const id = useSvgId();
  return (
    <svg aria-hidden viewBox="0 0 48 48" className={className}>
      <defs><Newsprint id={id} rough={0.4} specks={0.25} scale={0.5} /></defs>
      <g filter={`url(#${id})`}>
        <image href={illustrationPath("planet-engraved")} x="1" y="9" width="46" height="32" />
        <path d={sparkle(8, 9, 3.4)} fill={c.newsprint} />
        <path d={sparkle(41, 40, 2.6)} fill={c.mustard} />
      </g>
    </svg>
  );
}
