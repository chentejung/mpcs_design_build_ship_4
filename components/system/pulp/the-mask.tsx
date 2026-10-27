"use client";
// Pulp's drawing kit after The Mask on the American Comics board (picture 08), an illustrated one-sheet: the grin
// that fills the face from ear to ear (the Comedy pictogram), the city skyline under its palms, swept by premiere
// searchlights, at the foot of the /bijou hero and of THE END, and the billing block at the poster's foot, which
// app/system.css sets the credits as.
import { c, Engraving, f, ink, Screen, useSvgId } from "./press";

// A dramatic cropped face under a fedora, after the illustrated one-sheet on Mood Board 02.
export function GrinGlyph() {
  const id = useSvgId();
  const face = "M22 36Q20 62 34 78L56 88Q73 82 81 60L78 29Z";
  return (
    <g transform="scale(.25)">
      <defs>
        <Engraving id={`${id}-h`} gap={2.2} />
        <Screen id={`${id}-d`} color={c.red} gap={5} r={1} />
        <clipPath id={`${id}-f`}><path d={face} /></clipPath>
      </defs>
      <path d="M0 0H96V96H0Z" fill={c.red} />
      <path d="M0 0H96V96H0Z" fill={`url(#${id}-d)`} />
      <path d="M7 96L27 72L55 86L74 67L99 96" fill={c.newsprint} {...ink(3)} />
      <path d={face} fill={c.mustard} {...ink(3)} />
      <g clipPath={`url(#${id}-f)`}>
        <path d="M10 34L70 26L41 46L29 65L43 87L17 87Z" fill={c.ink} />
        <path d="M57 32L92 31L93 91L48 92L64 76L71 52Z" fill={`url(#${id}-h)`} />
        <path d="M41 48L51 44L46 57L53 59" fill="none" {...ink(2.4)} />
        <path d="M57 41Q67 35 74 40L66 44Z" fill={c.newsprint} {...ink(1.7)} />
        <circle cx="65" cy="40" r="2.6" fill={c.ink} />
        <path d="M38 60Q58 66 77 51Q72 77 58 79Q44 78 38 60Z" fill={c.ink} />
        <path d="M40 62Q60 69 75 56L70 66Q57 75 44 68Z" fill={c.newsprint} />
        <path d="M48 65L49 71M56 66L57 72M64 63L65 69M70 60L71 65" {...ink(1.2)} />
        <path d="M36 58L31 54M76 50L79 46M52 82L63 81" fill="none" {...ink(2)} />
      </g>
      <path d="M16 29L21 4L53 8L66 1L79 19L96 11L91 24L7 51L0 43Z" fill={c.peach} {...ink(3)} />
      <path d="M17 24L74 10L79 20L16 38Z" fill={c.ink} />
      <path d="M3 42L90 16M24 8L24 20M31 9L31 17M38 10L38 16" fill="none" {...ink(1.4)} />
    </g>
  );
}

// A palm tree's silhouette, its trunk rising from (x, y) to a height `h`, leaning `lean`.
function Palm({ x, y, h, lean = 0.12 }: { x: number; y: number; h: number; lean?: number }) {
  const tx = x + h * lean;
  const ty = y - h;
  const frond = (a: number, l: number) => {
    const r = (a * Math.PI) / 180;
    const ex = tx + Math.cos(r) * l;
    const ey = ty + Math.sin(r) * l;
    const mx = tx + Math.cos(r) * l * 0.5;
    const my = ty + Math.sin(r) * l * 0.5 - l * 0.22;
    return `M${f(tx)} ${f(ty)}Q${f(mx)} ${f(my - l * 0.08)} ${f(ex)} ${f(ey)}Q${f(mx)} ${f(my + l * 0.12)} ${f(tx)} ${f(ty)}Z`;
  };
  return (
    <g fill={c.ink}>
      <path d={`M${f(x - h * 0.02)} ${y}Q${f(x + h * lean * 0.3)} ${f(y - h * 0.5)} ${f(tx - h * 0.012)} ${f(ty)}H${f(tx + h * 0.012)}Q${f(x + h * lean * 0.3 + h * 0.03)} ${f(y - h * 0.5)} ${f(x + h * 0.03)} ${y}Z`} />
      {[-170, -140, -105, -70, -35, -8].map((a) => <path key={a} d={frond(a, h * 0.42)} />)}
    </g>
  );
}

// Deterministic pseudo-random sequence, so the server and the browser draw the same skyline.
function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

// The skyline along `y` from x0 to x1 against a sunset glow: towers, a few lit windows in Mustard, and palms standing
// in front.
export function Skyline({ x0, x1, y, h, seed = 3, palms = [0.08, 0.92] }: { x0: number; x1: number; y: number; h: number; seed?: number; palms?: number[] }) {
  const id = useSvgId();
  const rand = seeded(seed);
  const towers: { x: number; w: number; t: number }[] = [];
  for (let x = x0; x < x1; ) {
    const w = h * (0.14 + rand() * 0.22);
    towers.push({ x, w, t: y - h * (0.25 + Math.pow(rand(), 1.6) * 0.75) });
    x += w * (0.8 + rand() * 0.25);
  }
  const windows: string[] = [];
  for (const t of towers)
    for (let wy = t.t + h * 0.06; wy < y - h * 0.08; wy += h * 0.09)
      for (let wx = t.x + t.w * 0.2; wx < t.x + t.w * 0.8; wx += t.w * 0.3)
        if (rand() < 0.22) windows.push(`M${f(wx)} ${f(wy)}h${f(h * 0.035)}v${f(h * 0.04)}h${f(-h * 0.035)}Z`);
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.red} stopOpacity="0" />
          <stop offset="0.5" stopColor={c.red} stopOpacity="0.9" />
          <stop offset="1" stopColor={c.peach} />
        </linearGradient>
      </defs>
      <rect x={x0} y={y - h * 1.25} width={x1 - x0} height={h * 1.25} fill={`url(#${id})`} />
      <path d={towers.map((t) => `M${f(t.x)} ${y}V${f(t.t)}H${f(t.x + t.w)}V${y}Z`).join("")} fill={c.ink} />
      <path d={windows.join("")} fill={c.mustard} />
      {palms.map((p, i) => <Palm key={p} x={x0 + (x1 - x0) * p} y={y} h={h * 1.15} lean={i % 2 ? -0.14 : 0.12} />)}
    </g>
  );
}

// Premiere searchlights: Newsprint beams fanning up from the skyline's foot.
export function Searchlights({ beams, y, length, spread = 7 }: { beams: [x: number, angle: number][]; y: number; length: number; spread?: number }) {
  return (
    <g fill={c.newsprint} opacity="0.2">
      {beams.map(([x, a]) => {
        const r1 = ((a - spread) * Math.PI) / 180;
        const r2 = ((a + spread) * Math.PI) / 180;
        return <path key={`${x}-${a}`} d={`M${x} ${y}L${f(x + Math.sin(r1) * length)} ${f(y - Math.cos(r1) * length)}L${f(x + Math.sin(r2) * length)} ${f(y - Math.cos(r2) * length)}Z`} />;
      })}
    </g>
  );
}
