"use client";
// Pulp's drawing kit after Krakoom! on the American Comics board (picture 05): the blast at the heart of the sound
// effect, jagged Hero Red round Mustard round a Newsprint flash, with rubble flying out of it. It is the All
// pictogram (everything at once), the eyebrow's ornament, and, with a cross knocked out, the Remove icon.
import { burst } from "./print";
import { c, ink } from "./press";

// The blast centred on (cx, cy) with outer radius r.
export function Blast({ cx, cy, r, w = 1.4, rubble = true }: { cx: number; cy: number; r: number; w?: number; rubble?: boolean }) {
  const k = r / 11;
  return (
    <g>
      <polygon points={burst(cx, cy, r, r * 0.56, 11, 0.22)} fill={c.red} {...ink(w)} />
      <polygon points={burst(cx, cy, r * 0.66, r * 0.4, 9, 0.18)} fill={c.mustard} />
      <polygon points={burst(cx, cy, r * 0.34, r * 0.2, 7, 0.1)} fill={c.newsprint} />
      {rubble && (
        <g fill={c.ink}>
          {[[-0.95, -0.7, 20], [0.9, -0.85, -15], [1.02, 0.66, 35], [-0.86, 0.92, -30]].map(([dx, dy, a]) => (
            <rect key={`${dx}`} x={cx + dx * r - 1.1 * k} y={cy + dy * r - 1.1 * k} width={2.2 * k} height={2.2 * k} transform={`rotate(${a} ${cx + dx * r} ${cy + dy * r})`} />
          ))}
        </g>
      )}
    </g>
  );
}

// The All pictogram: the blast on an Ink panel.
export function BlastGlyph() {
  return (
    <g>
      <rect width="24" height="24" fill={c.ink} />
      <Blast cx={12} cy={12} r={10.4} w={1} />
    </g>
  );
}
