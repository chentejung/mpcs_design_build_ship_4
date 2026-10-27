"use client";
// The original cover dimensions and live lettering over an engraved illustration plate.
// Mood Board 02: Captain Aero’s rocket, Space Fleet’s vortex, and the distressed print of The Mask.
// One local plate is cropped inside the existing cover, phone banner and closing-card viewBoxes.
import { burst } from "./print";
import { Trail } from "./captain-aero";
import { Scroll } from "./into-the-unknown";
import { c, display, ink, Lettering, Newsprint, poster, Screen, sparkle, useSvgId } from "./press";
import { IssueBox } from "./space-fleet";
import { illustrationPath } from "./illustrations";

const Stars = ({ at }: { at: [number, number, number][] }) => (
  <g fill={c.newsprint}>{at.map(([x, y, r]) => <path key={`${x}-${y}`} d={sparkle(x, y, r)} />)}</g>
);

// A starburst blurb at (x, y) shouting two lines.
function Blurb({ x, y, r, top, bottom, rotate = 0 }: { x: number; y: number; r: number; top: string; bottom: string; rotate?: number }) {
  return (
    <g transform={`rotate(${rotate} ${x} ${y})`}>
      <polygon points={burst(x, y, r, r * 0.72, 14, 0.12)} fill={c.newsprint} {...ink(2.4)} />
      <text x={x} y={y - r * 0.06} textAnchor="middle" fontSize={r * 0.62} fill={c.red} style={display}>{top}</text>
      <text x={x} y={y + r * 0.42} textAnchor="middle" fontSize={r * 0.36} fill={c.ink} style={poster} letterSpacing={r * 0.02}>{bottom}</text>
    </g>
  );
}

// The Bijou's cover, issue No. 4 (Week 4).
export function PulpCover({ wide = false, className = "" }: { wide?: boolean; className?: string }) {
  const id = useSvgId();
  if (wide)
    return (
      <svg aria-hidden viewBox="0 0 360 156" className={className}>
        <defs>
          <Newsprint id={id} rough={0.8} specks={0.2} />
          <Screen id={`${id}-dots`} color={c.ink} r={1.1} gap={4.5} angle={45} />
          <clipPath id={`${id}-sheet`}><rect width="360" height="156" /></clipPath>
        </defs>
        <g filter={`url(#${id})`} clipPath={`url(#${id}-sheet)`}>
          <rect width="360" height="156" fill={c.ink} />
          <image href="/bijou/art/atomic-odyssey.webp" x="134" y="-64" width="226" height="316" preserveAspectRatio="xMidYMid slice" />
          <path d="M0 0H162L206 114H0Z" fill={c.ink} />
          <Stars at={[[150, 18, 3], [190, 88, 2]]} />
          <Lettering x={16} y={34} size={18} text="THE" />
          <Lettering x={14} y={90} size={58} text="BIJOU" width={176} tone={[c.newsprint, c.red]} side={c.sepia} />
          <rect x="-4" y="114" width="368" height="46" fill={c.mustard} {...ink(3)} />
          <text x="180" y="136" dy="0.36em" textAnchor="middle" fontSize="15" fill={c.ink} style={poster} letterSpacing="1">NOW PLAYING · TOP RATED · ALL OF TMDB!</text>
        </g>
        <rect x="1.5" y="1.5" width="357" height="153" fill="none" {...ink(3)} />
      </svg>
    );
  return (
    <svg aria-hidden viewBox="0 0 300 420" className={className}>
      <defs>
        <Newsprint id={id} rough={1} specks={0.2} />
        <Screen id={`${id}-dots`} color={c.ink} r={1.3} gap={5} angle={45} />
        <clipPath id={`${id}-sheet`}><rect width="300" height="420" /></clipPath>
      </defs>
      <g filter={`url(#${id})`} clipPath={`url(#${id}-sheet)`}>
        <rect width="300" height="420" fill={c.ink} />
        <image href="/bijou/art/atomic-odyssey.webp" width="300" height="420" preserveAspectRatio="xMidYMid slice" />
        <Scroll x={52} y={378} w={196} h={22} text="NOW SHOWING TONIGHT!" size={13} />
        {/* The strap line, the issue box and the masthead. */}
        <rect x="-4" y="-4" width="308" height="30" fill={c.newsprint} {...ink(2.5)} />
        <text x="150" y="13" dy="0.36em" textAnchor="middle" fontSize="12.5" fill={c.ink} style={poster} letterSpacing="0.6">STRANGE FEATURES OF THE SILVER SCREEN!</text>
        <IssueBox x={10} y={36} w={46} no={4} />
        <Lettering x={68} y={56} size={22} text="THE" />
        <Lettering x={64} y={120} size={72} text="BIJOU" width={222} />
        <Blurb x={250} y={160} r={34} top="NEW" bottom="MONTHLY!" rotate={12} />
        <g style={poster} textAnchor="end" fill={c.mustard} stroke={c.ink} strokeWidth="3" paintOrder="stroke" strokeLinejoin="round">
          <text x="290" y="318" fontSize="11" fill={c.newsprint} style={display}>featuring</text>
          <text x="290" y="338" fontSize="19" letterSpacing="0.5">EVERY GENRE</text>
          <text x="290" y="358" fontSize="19" letterSpacing="0.5">OF THRILLS!</text>
        </g>
      </g>
      <rect x="1.5" y="1.5" width="297" height="417" fill="none" {...ink(3)} />
    </svg>
  );
}

// The closing card above every page's footer: the night over the skyline, the rocket flying off, and THE END.
export function TheEnd({ className = "" }: { className?: string }) {
  const id = useSvgId();
  return (
    <svg aria-hidden viewBox="0 0 1200 160" className={className}>
      <defs>
        <Newsprint id={id} rough={1} specks={0.2} />
        <Screen id={`${id}-dots`} color={c.red} r={1.2} gap={6} angle={45} />
      </defs>
      <g filter={`url(#${id})`}>
        <rect width="1200" height="160" fill={c.ink} />
        <image href={illustrationPath("skyline-engraved")} width="1200" height="160" preserveAspectRatio="xMidYMid slice" />
        <rect width="1200" height="160" fill={c.ink} opacity="0.48" />
        <rect width="1200" height="160" fill={`url(#${id}-dots)`} opacity="0.25" />
        <Stars at={[[80, 30, 4], [420, 22, 3], [520, 120, 2.4], [760, 30, 3.4], [1140, 110, 3], [300, 70, 2.4], [1110, 22, 2.6]]} />
        <image href={illustrationPath("planet-engraved")} x="135" y="22" width="112" height="76" />
        <Trail a={[760, 110]} c1={[860, 128]} c2={[930, 90]} b={[978, 70]} w={14} />
        <image href={illustrationPath("rocket-engraved")} x="958" y="46" width="86" height="36" transform="rotate(-18 990 64)" />
        <Lettering x={600} y={104} size={70} text="THE END" width={360} anchor="middle" />
      </g>
    </svg>
  );
}
