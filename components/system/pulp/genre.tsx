"use client";
// Pulp's Category pictograms: the original American Comics panels and twelve matching engraved plates,
// keylined in Ink and printed on the kit's worn paper. They head filter chips and Category badges and are
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
import {
  CameraGlyph, ColumnGlyph, CompassGlyph, DramaGlyph, FamilyGlyph, FantasyGlyph, HandcuffsGlyph,
  HelmetGlyph, MagnifierGlyph, MusicGlyph, TelevisionGlyph, WesternGlyph,
} from "./genre-panels";

const plates: Record<Category | "all", PulpIllustration> = {
  all: "blast-engraved", thriller: "thriller-engraved", comedy: "comedy-engraved",
  animation: "look-empty", action: "action-engraved", "science-fiction": "saucer-engraved",
  romance: "romance-engraved", horror: "horror-engraved",
  "adventure": "adventure-engraved",
  "crime": "crime-engraved",
  "documentary": "documentary-engraved",
  "drama": "drama-engraved",
  "family": "family-engraved",
  "fantasy": "fantasy-engraved",
  "history": "history-engraved",
  "music": "music-engraved",
  "mystery": "mystery-engraved",
  "tv-movie": "tv-movie-engraved",
  "war": "war-engraved",
  "western": "western-engraved",

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
  adventure: { glyph: CompassGlyph, from: "A compass rose over an uncharted mountain range" },
  crime: { glyph: HandcuffsGlyph, from: "A pair of linked handcuffs on a police serial cover" },
  documentary: { glyph: CameraGlyph, from: "A twin-reel newsreel camera on its tripod" },
  drama: { glyph: DramaGlyph, from: "The stage masks: a smile and a tear" },
  family: { glyph: FamilyGlyph, from: "A family beneath a roof and a heart" },
  fantasy: { glyph: FantasyGlyph, from: "A sorcerer's hat under a sky of four-point stars" },
  history: { glyph: ColumnGlyph, from: "An engraved classical column and pediment" },
  music: { glyph: MusicGlyph, from: "A vinyl record and a pair of musical notes" },
  mystery: { glyph: MagnifierGlyph, from: "A watchful eye inside a detective's magnifying glass" },
  "tv-movie": { glyph: TelevisionGlyph, from: "A rabbit-ear television with a play symbol" },
  war: { glyph: HelmetGlyph, from: "A field helmet with a hanging chin strap" },
  western: { glyph: WesternGlyph, from: "A wide-brimmed cowboy hat and sheriff's star" },
};

export function PulpGenreIcon({ id, className }: { id: Category | "all"; className: string }) {
  const uid = useSvgId();
  const Glyph = pulpGlyphs[id].glyph;
  const plate = plates[id];
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
      {plate && <image href={illustrationPath(plate)} x="1" y="1" width="22" height="22" preserveAspectRatio="xMidYMid slice" />}
      {id === "animation" && <path d="M11.5 4.2h2l-.4 5h-1.2ZM11.9 10.3h1.2v1.3h-1.2Z" fill={c.ink} />}
      <rect x="1" y="1" width="22" height="22" fill="none" stroke={c.ink} strokeWidth="2" />
    </svg>
  );
}
