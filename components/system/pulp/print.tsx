// Print helpers from Week 2's artifact toolkit that the Pulp kit draws with: paper grain, a halftone screen, and the
// starburst outline of blurbs and blasts.

// Paper grain: fractal noise to multiply over a sheet. `frequency` "x y" stretches it into fibres.
export function Grain({ id, grain = 0.4, seed = 1, frequency = "0.85", ...region }: {
  id: string;
  grain?: number;
  seed?: number;
  frequency?: string;
} & React.SVGProps<SVGFilterElement>) {
  return (
    <filter id={id} {...region}>
      <feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves="2" seed={seed} />
      <feColorMatrix type="matrix" values={`1.3 0 0 0 0.2  1.3 0 0 0 0.2  1.3 0 0 0 0.2  0 0 0 0 ${grain}`} />
    </filter>
  );
}

// Halftone / Ben-Day dot screen.
export function Dots({ id, color, r = 1.6, gap = 6, angle = 45, bg }: { id: string; color: string; r?: number; gap?: number; angle?: number; bg?: string }) {
  return (
    <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
      {bg && <rect width={gap} height={gap} fill={bg} />}
      <circle cx={gap / 2} cy={gap / 2} r={r} fill={color} />
    </pattern>
  );
}

// Star-burst polygon points.
export const burst = (cx: number, cy: number, r1: number, r2: number, n: number, jitter = 0) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const r = (i % 2 ? r2 : r1) * (1 + (jitter * (((i * 37) % 11) - 5)) / 10);
    const a = (Math.PI * i) / n - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
