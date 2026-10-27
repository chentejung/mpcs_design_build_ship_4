"use client";
// Pulp's drawing kit after Ring! Ring! on the American Comics board (picture 13), a pop-art panel: the red rotary
// telephone ringing on the desk (the Thriller pictogram: a call nobody should answer) and the red lips above it
// (Romance), each on its own panel in a dot screen.
import { c, Engraving, ink, Screen, useSvgId } from "./press";

// The Thriller pictogram: the red rotary telephone shaking on a Mustard panel.
export function TelephoneGlyph() {
  const id = useSvgId();
  return (
    <g transform="scale(.25)">
      <defs><Engraving id={id} gap={3} /></defs>
      <path d="M0 0H96V96H0Z" fill={c.mustard} />
      <path d="M0 75L96 60V96H0Z" fill={`url(#${id})`} />
      <path d="M15 81L23 47L64 43L81 76L75 86L23 89Z" fill={c.red} {...ink(3.5)} />
      <path d="M23 76L75 72L81 76L75 86L23 89L15 81Z" fill={c.ink} />
      <path d="M23 52L21 75L32 72L36 51Z" fill={c.peach} opacity=".7" />
      <path d="M11 43C4 16 72 8 79 32L78 44L63 47L57 32Q38 29 29 38L31 48L16 52Z" fill={c.red} {...ink(3.4)} />
      <path d="M14 31Q40 14 71 25" fill="none" stroke={c.peach} strokeWidth="3" />
      <path d="M12 42L29 39L31 48L16 52ZM60 36L79 33L78 44L63 47Z" fill={c.ink} />
      <ellipse cx="49" cy="61" rx="15" ry="12" fill={c.newsprint} {...ink(2.4)} />
      <ellipse cx="49" cy="61" rx="7" ry="5.5" fill={c.ink} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <circle key={i} cx={49 + Math.cos(i * Math.PI / 4) * 11} cy={61 + Math.sin(i * Math.PI / 4) * 8.5} r="1.6" fill={c.ink} />)}
      <path d="M80 42C93 39 94 51 84 54C76 57 94 58 88 64C78 68 97 71 84 77" fill="none" {...ink(2.5)} />
      <path d="M5 13L12 22M38 4L39 13M82 12L78 21M3 59L10 57" fill="none" {...ink(3)} />
    </g>
  );
}

// The Romance pictogram: the red lips on a Peach panel of Hero Red dots.
export function LipsGlyph() {
  const id = useSvgId();
  return (
    <g>
      <defs><Screen id={id} color={c.red} r={0.55} gap={2.2} angle={30} /></defs>
      <rect width="24" height="24" fill={c.peach} />
      <rect width="24" height="24" fill={`url(#${id})`} opacity="0.55" />
      <path d="M3 12.2C5.6 8.2 9 7.2 12 9.4C15 7.2 18.4 8.2 21 12.2C17.4 13 6.6 13 3 12.2Z" fill={c.red} {...ink(1.2)} />
      <path d="M3 12.2C6.6 13.4 17.4 13.4 21 12.2C18.6 17 15.4 18.6 12 18.6C8.6 18.6 5.4 17 3 12.2Z" fill={c.red} {...ink(1.2)} />
      <path d="M4 12.9Q8 18.2 12 17.8Q17 17.9 20 12.8Q14 15.9 4 12.9Z" fill={c.ink} opacity=".65" />
      <path d="M5 11L7 9.5M7.2 11.5L9 9.4M9.3 11.7L10.4 10M13.4 10L14 11.6M15.4 9.3L15.9 11.5M17.4 10L18 11.4" stroke={c.ink} strokeWidth=".45" />
      <path d="M13.6 15.6C15.2 15.4 16.4 14.8 17.2 14" fill="none" stroke={c.newsprint} strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}
