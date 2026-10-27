"use client";
// Pulp's drawing kit after Adventures into the Unknown! on the American Comics board (picture 29): the clawed hand
// reaching up out of the dark, dripping (the Horror pictogram), on the cover's Hero Red, and the curling scroll
// banner the cover pins its blurb on, which carries the /bijou hero's "featuring" line.
import { c, Engraving, ink, poster, Screen, useSvgId } from "./press";

// A foreshortened, sinewy monster hand: separated claw silhouettes stay legible at chip size.
export function ClawGlyph() {
  const id = useSvgId();
  const hand = "M32 102L29 76L12 62L6 42Q8 35 13 41L23 57L31 59L22 30L24 13Q28 7 31 15L32 30L42 48L43 23L49 7Q55 2 55 11L52 27L55 48L65 26L75 17Q83 17 77 25L72 33L66 58L80 49L88 50Q94 55 86 58L78 62L69 80L64 102Z";
  return (
    <g transform="scale(.25)">
      <defs>
        <Engraving id={`${id}-h`} gap={2.8} />
        <Screen id={`${id}-d`} color={c.ink} r={1.1} gap={5} />
        <clipPath id={`${id}-c`}><path d={hand} /></clipPath>
      </defs>
      <path d="M0 0H96V96H0Z" fill={c.red} />
      <path d="M0 0H96V96H0Z" fill={`url(#${id}-d)`} opacity=".4" />
      <path d="M4 94L22 53M85 90L72 72M4 18L18 30M90 3L79 14" stroke={c.mustard} strokeWidth="2" />
      <path d={hand} fill={c.peach} {...ink(3)} />
      <g clipPath={`url(#${id}-c)`}>
        <path d="M25 18L35 39L39 60L21 53L43 78L45 96H67L58 66L67 34L54 57L48 25L43 61Z" fill={c.sepia} />
        <path d="M0 0H96V96H0Z" fill={`url(#${id}-h)`} />
        <path d="M32 65L43 69L51 61M39 81L39 93M57 77L60 93M59 59L61 69" fill="none" {...ink(2.2)} />
      </g>
      <g fill={c.newsprint} {...ink(1.6)}>
        <path d="M23 18Q19 6 27 1L30 14Z" />
        <path d="M48 10Q50 -1 59 1L54 13Z" />
        <path d="M72 21Q77 10 87 13L78 26Z" />
        <path d="M7 46Q1 34 7 30L13 42Z" />
      </g>
      <path d="M33 73L35 87M66 67L64 78" stroke={c.mustard} strokeWidth="2" />
    </g>
  );
}

// The scroll banner across (x, y) to (x + w, y), curling at both ends, with its blurb set on it.
export function Scroll({ x, y, w, h, text, size }: { x: number; y: number; w: number; h: number; text: string; size: number }) {
  const id = useSvgId();
  const curl = h * 0.42;
  return (
    <g>
      <defs><Engraving id={id} gap={h * .09} /></defs>
      <path d={`M${x} ${y + curl}h${curl}v${h}h${-curl}l${curl * 0.5} ${-h / 2}Z`} fill={c.sepia} {...ink(1.8)} />
      <path d={`M${x + w} ${y + curl}h${-curl}v${h}h${curl}l${-curl * 0.5} ${-h / 2}Z`} fill={c.sepia} {...ink(1.8)} />
      <path d={`M${x + curl * 0.7} ${y}H${x + w - curl * 0.7}V${y + h}H${x + curl * 0.7}Z`} fill={c.newsprint} {...ink(1.8)} />
      <path d={`M${x + curl * .7} ${y}h${curl * .7}v${h}h${-curl * .7}ZM${x + w - curl * 1.4} ${y}h${curl * .7}v${h}h${-curl * .7}Z`} fill={`url(#${id})`} opacity=".6" />
      <path d={`M${x + curl * 1.5} ${y + h * .13}H${x + w - curl * 1.5}M${x + curl * 1.5} ${y + h * .89}H${x + w - curl * 1.5}`} fill="none" stroke={c.sepia} strokeWidth=".45" />
      <text x={x + w / 2} y={y + h / 2} dy="0.36em" textAnchor="middle" fontSize={size} fill={c.ink} style={poster} letterSpacing={size * 0.04}>{text}</text>
    </g>
  );
}
