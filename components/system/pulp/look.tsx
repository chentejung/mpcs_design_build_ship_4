"use client";
// Pulp's drawing kit after Look! on the American Comics board (picture 17), a pop-art panel: a Newsprint speech
// balloon over a Hero Red panel in a darker dot screen, and the sleeve and hand pointing up at it. The balloon is the
// Animation pictogram and, with a plus, a check or an arrow, the Save, Saved and Back icons; when nothing is saved,
// the whole panel points at an empty balloon.
import { IllustrationPlate } from "./illustrations";
import { c, ink, Screen, useSvgId } from "./press";

// The Animation pictogram: the balloon, shouting, on Look!'s red.
export function BalloonGlyph() {
  const id = useSvgId();
  return (
    <g>
      <defs><Screen id={id} color={c.ink} r={0.5} gap={2.2} angle={45} /></defs>
      <rect width="24" height="24" fill={c.red} />
      <rect width="24" height="24" fill={`url(#${id})`} opacity="0.3" />
      <path d="M12 3.2C17.4 3.2 21 6.2 21 9.8C21 13.4 17.4 16.4 12 16.4C11.2 16.4 10.4 16.3 9.6 16.2L5.6 20.8L6.6 15.4C4.4 14.2 3 12.2 3 9.8C3 6.2 6.6 3.2 12 3.2Z" fill={c.newsprint} {...ink(1.3)} />
      <path d="M4.8 7.7L6.3 5.8M5 10L5.8 8.8M17 13L19 11M15 14L16.6 12.5M7 17L8 15.6" fill="none" {...ink(.45)} />
      <path d="M12 6.2V10.4" fill="none" {...ink(2.2)} />
      <circle cx="12" cy="13.2" r="1.2" fill={c.ink} />
    </g>
  );
}

// The empty Saved page: Look!'s panel, the hand pointing at a balloon that has nothing in it yet. The caller lays the
// heading over the balloon (EmptyState in motifs.tsx), so the words stay real text.
export function LookPanel({ className = "" }: { className?: string }) {
  return <IllustrationPlate name="look-empty" viewBox="0 0 320 250" className={className} />;
}
