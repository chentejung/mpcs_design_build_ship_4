"use client";
// Pulp's drawing kit after Pow! on the American Comics board (picture 16), a pop-art panel: the fist landing in a
// Mustard burst, its skin in a Hero Red dot screen, motion lines trailing the swing. It is the Action pictogram.
import { burst } from "./print";
import { c, ink, Screen, useSvgId } from "./press";

export function FistGlyph() {
  const id = useSvgId();
  return (
    <g>
      <defs><Screen id={id} color={c.red} r={0.5} gap={2} angle={20} /></defs>
      <rect width="24" height="24" fill={c.newsprint} />
      <polygon points={burst(15, 9.5, 9.5, 5.6, 9, 0.18)} fill={c.mustard} {...ink(1)} />
      <path d="M1.5 21.5L6 17M0.5 17.5L4 15M5 23.5L8.4 19.6" fill="none" {...ink(1.2)} />
      <path d="M6.4 9.8C6.2 8 7.6 7.2 9 7.7C9.4 6.2 11.4 5.9 12.4 7.1C13.1 5.9 15.1 5.9 15.8 7.3C17 6.6 18.8 7.3 18.8 9V14C18.8 18 16.2 20.2 12.6 20.2H10.4C7.8 20.2 6.2 18.4 6.2 15.8Z" fill={c.peach} {...ink(1.3)} />
      <path d="M6.4 9.8C6.2 8 7.6 7.2 9 7.7C9.4 6.2 11.4 5.9 12.4 7.1C13.1 5.9 15.1 5.9 15.8 7.3C17 6.6 18.8 7.3 18.8 9V14C18.8 18 16.2 20.2 12.6 20.2H10.4C7.8 20.2 6.2 18.4 6.2 15.8Z" fill={`url(#${id})`} />
      <path d="M9 7.7L9.2 11M12.4 7.1V11M15.8 7.3V11M6.3 12.4C8.4 11.4 12.2 11.6 14.2 13C13 14.6 9.4 15 6.6 14.6" fill="none" {...ink(1)} />
      <path d="M18.2 10.8L17.2 15.7L14.5 18.5L9.6 19.5L12.6 20.2Q18.8 20 18.8 14Z" fill={c.ink} />
      <path d="M7.5 15.5L8.5 17M9.5 15.8L10.5 17.5M11.5 15.5L12.3 17M13.5 15L14.2 16M7.6 8.5L8 10M10.6 7.8V9.5M14 7.6V9.4M17 8.1V9.5" fill="none" {...ink(.4)} />
    </g>
  );
}
