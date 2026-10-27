"use client";
// Pulp's Category pictograms: each a tiny pop-art panel cut from one picture on the American Comics board, keylined in
// Ink and printed on the same worn paper as the rest of the kit. They head the filter chips and Category badges and are
// decoration only: the label next to them says the Category.
import type { Category } from "@/lib/categories";
import { BalloonGlyph } from "./look";
import { BlastGlyph } from "./krakoom";
import { ClawGlyph } from "./into-the-unknown";
import { FistGlyph } from "./pow";
import { c, Newsprint, Screen, useSvgId } from "./press";
import { LipsGlyph, TelephoneGlyph } from "./ring-ring";
import { GrinGlyph } from "./the-mask";
import { SaucerGlyph } from "./weird-space-tales";
import { illustrationPath, type PulpIllustration } from "./illustrations";

const plates: Record<Category | "all", PulpIllustration> = {
  all: "blast-engraved", thriller: "thriller-engraved", comedy: "comedy-engraved",
  animation: "look-empty", action: "action-engraved", "science-fiction": "saucer-engraved",
  romance: "romance-engraved", horror: "horror-engraved",
};

export const pulpGlyphs: Record<Category | "all", { glyph: () => React.JSX.Element; from: string }> = {
  all: { glyph: BlastGlyph, from: "The blast at the heart of the sound effect (Krakoom!)" },
  thriller: { glyph: TelephoneGlyph, from: "The telephone ringing on the desk (Ring! Ring!)" },
  comedy: { glyph: GrinGlyph, from: "The grin from ear to ear (The Mask)" },
  animation: { glyph: BalloonGlyph, from: "The speech balloon, shouting (Look!)" },
  action: { glyph: FistGlyph, from: "The fist landing in its burst (Pow!)" },
  "science-fiction": { glyph: SaucerGlyph, from: "The flying saucer and its beam (Weird Space Tales)" },
  romance: { glyph: LipsGlyph, from: "The red lips (Ring! Ring!)" },
  horror: { glyph: ClawGlyph, from: "The claw reaching up, dripping (Into the Unknown)" },
};

export function PulpGenreIcon({ id, className }: { id: Category | "all"; className: string }) {
  const uid = useSvgId();
  const Glyph = pulpGlyphs[id].glyph;
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className}>
      <defs>
        <Newsprint id={uid} rough={0.3} specks={0.2} scale={0.35} />
        <Screen id={`${uid}-screen`} color={c.ink} r={0.18} gap={0.9} />
        <clipPath id={`${uid}-c`}><rect width="24" height="24" /></clipPath>
      </defs>
      <g filter={`url(#${uid})`} clipPath={`url(#${uid}-c)`}>
        <Glyph />
        <path d="M0 0H24L0 24Z" fill={`url(#${uid}-screen)`} opacity=".3" />
        <path d="M2 6V2H8M17 22H22V17" fill="none" stroke={c.newsprint} strokeWidth=".35" opacity=".7" />
      </g>
      {/* Keep the vector silhouette underneath while the locally hosted illustration loads. */}
      <image href={illustrationPath(plates[id])} x="1" y="1" width="22" height="22" preserveAspectRatio="xMidYMid slice" />
      {id === "animation" && <path d="M11.5 4.2h2l-.4 5h-1.2ZM11.9 10.3h1.2v1.3h-1.2Z" fill={c.ink} />}
      <rect x="1" y="1" width="22" height="22" fill="none" stroke={c.ink} strokeWidth="2" />
    </svg>
  );
}
