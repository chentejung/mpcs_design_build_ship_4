"use client";
// Twelve original miniatures extend the existing comic panels. Broad silhouettes survive at chip size;
// offset color, engraved shadows and Ben-Day screens tie them to the original Pulp drawing kit.
import { c, Engraving, ink, Screen, sparkle, useSvgId } from "./press";

function Panel({ background, children }: { background: string; children: React.ReactNode }) {
  const id = useSvgId();
  return (
    <g transform="scale(.25)">
      <defs>
        <Screen id={`${id}-dots`} color={c.ink} r={0.8} gap={4} />
        <Engraving id={`${id}-hatch`} gap={3} />
      </defs>
      <path d="M0 0H96V96H0Z" fill={background} />
      <path d="M0 0H96V96Z" fill={`url(#${id}-dots)`} opacity=".45" />
      <path d="M0 76L96 59V96H0Z" fill={`url(#${id}-hatch)`} opacity=".45" />
      <g {...ink(3.5)}>{children}</g>
      <path d="M6 8h18M6 12h9M72 86h17" fill="none" stroke={c.newsprint} strokeWidth="1.3" opacity=".7" />
    </g>
  );
}

export function CompassGlyph() {
  return (
    <Panel background={c.peach}>
      <path d="M6 72L28 39L44 62L67 31L91 71" fill={c.sepia} />
      <circle cx="48" cy="46" r="29" fill={c.mustard} />
      <circle cx="48" cy="46" r="23" fill={c.newsprint} />
      <path d="M48 17v8m0 42v8M19 46h8m42 0h8" fill="none" />
      <path d="M61 24L53 51L35 68L43 41Z" fill={c.red} />
      <path d="M43 41L53 51L35 68Z" fill={c.ink} />
      <circle cx="48" cy="46" r="3" fill={c.newsprint} />
    </Panel>
  );
}

export function HandcuffsGlyph() {
  return (
    <Panel background={c.mustard}>
      <path d="M35 36L47 46L61 40" fill="none" strokeWidth="7" />
      <path d="M35 36L47 46L61 40" fill="none" stroke={c.newsprint} strokeWidth="2" />
      <g transform="rotate(-24 27 53)">
        <rect x="18" y="24" width="19" height="18" fill={c.red} />
        <ellipse cx="27" cy="55" rx="17" ry="22" fill={c.newsprint} />
        <ellipse cx="27" cy="55" rx="10" ry="14" fill={c.sepia} />
      </g>
      <g transform="rotate(24 70 54)">
        <rect x="61" y="23" width="19" height="18" fill={c.red} />
        <ellipse cx="70" cy="54" rx="17" ry="22" fill={c.newsprint} />
        <ellipse cx="70" cy="54" rx="10" ry="14" fill={c.sepia} />
      </g>
    </Panel>
  );
}

export function CameraGlyph() {
  return (
    <Panel background={c.peach}>
      <path d="M45 64L30 87M45 64L61 87" fill="none" strokeWidth="5" />
      <rect x="16" y="37" width="48" height="29" rx="3" fill={c.red} />
      <path d="M64 43L85 33V68L64 59Z" fill={c.ink} />
      <circle cx="29" cy="26" r="14" fill={c.newsprint} />
      <circle cx="56" cy="26" r="14" fill={c.mustard} />
      {[29, 56].map((x) => <g key={x} fill={c.ink} stroke="none"><circle cx={x} cy="20" r="3" /><circle cx={x - 5} cy="29" r="3" /><circle cx={x + 5} cy="29" r="3" /></g>)}
      <path d="M23 46h32M23 52h18" fill="none" stroke={c.peach} strokeWidth="2" />
    </Panel>
  );
}

export function DramaGlyph() {
  return (
    <Panel background={c.red}>
      <path d="M13 19Q31 10 50 20L47 50Q33 72 18 49Z" fill={c.mustard} />
      <path d="M21 31l8-2m9-1 7 3M24 43Q33 54 42 41" fill="none" />
      <path d="M45 35Q64 26 84 36L79 68Q63 90 49 67Z" fill={c.newsprint} />
      <path d="M53 46l8 3m10 0 7-4M56 67Q65 56 74 65" fill="none" />
      <path d="M74 51q-7 9 0 10q5-2 0-10" fill={c.red} strokeWidth="1" />
    </Panel>
  );
}

export function FamilyGlyph() {
  return (
    <Panel background={c.mustard}>
      <path d="M9 42L48 12L87 42" fill={c.red} />
      <path d="M18 39L48 17L78 39V81H18Z" fill={c.newsprint} />
      <path d="M40 34C31 24 22 39 40 49C58 39 49 24 40 34Z" fill={c.red} transform="translate(8 0)" strokeWidth="2" />
      <circle cx="33" cy="55" r="7" fill={c.peach} />
      <circle cx="64" cy="55" r="7" fill={c.peach} />
      <path d="M23 78V72q10-17 20 0v6M54 78V72q10-17 20 0v6" fill={c.sepia} />
      <circle cx="48" cy="66" r="6" fill={c.peach} />
      <path d="M40 82V78q8-13 16 0v4" fill={c.red} />
    </Panel>
  );
}

export function FantasyGlyph() {
  return (
    <Panel background={c.sepia}>
      <path d="M25 71L48 12L69 70Z" fill={c.red} />
      <path d="M39 34L48 12L50 42Z" fill={c.peach} stroke="none" />
      <path d="M16 70Q46 59 80 70L87 78Q47 93 10 79Z" fill={c.mustard} />
      <path d="M29 60Q47 66 66 59L69 69Q48 77 25 70Z" fill={c.ink} />
      <path d={sparkle(52, 48, 9)} fill={c.mustard} strokeWidth="1" />
      <path d={sparkle(77, 25, 9)} fill={c.newsprint} stroke="none" />
      <path d={sparkle(18, 42, 6)} fill={c.mustard} stroke="none" />
    </Panel>
  );
}

export function ColumnGlyph() {
  return (
    <Panel background={c.peach}>
      <path d="M13 27L48 10L83 27Z" fill={c.red} />
      <path d="M18 30H78V40H18ZM25 42H71V73H25ZM18 74H78V82H18ZM12 83H84V89H12Z" fill={c.newsprint} />
      <path d="M34 42v31M47 42v31M60 42v31" fill="none" strokeWidth="5" />
      <path d="M28 34h40M26 78h43" fill="none" stroke={c.sepia} strokeWidth="1.3" />
      <path d="M63 47l-6 7 5 8-5 6" fill="none" strokeWidth="1.5" />
    </Panel>
  );
}

export function MusicGlyph() {
  return (
    <Panel background={c.red}>
      <circle cx="40" cy="50" r="29" fill={c.ink} />
      <circle cx="40" cy="50" r="22" fill="none" stroke={c.sepia} strokeWidth="2" />
      <circle cx="40" cy="50" r="12" fill={c.mustard} />
      <circle cx="40" cy="50" r="3" fill={c.ink} stroke="none" />
      <path d="M59 62V23L82 17V55" fill="none" stroke={c.ink} strokeWidth="9" />
      <path d="M59 62V23L82 17V55" fill="none" stroke={c.newsprint} strokeWidth="5" />
      <ellipse cx="53" cy="64" rx="9" ry="6" fill={c.newsprint} />
      <ellipse cx="76" cy="57" rx="9" ry="6" fill={c.newsprint} />
    </Panel>
  );
}

export function MagnifierGlyph() {
  return (
    <Panel background={c.mustard}>
      <path d="M57 59L82 84" fill="none" strokeWidth="15" />
      <path d="M60 62L80 82" fill="none" stroke={c.red} strokeWidth="8" />
      <circle cx="40" cy="39" r="26" fill={c.newsprint} />
      <circle cx="40" cy="39" r="20" fill={c.peach} />
      <path d="M23 40Q40 23 57 40Q40 56 23 40Z" fill={c.newsprint} strokeWidth="2" />
      <circle cx="40" cy="40" r="7" fill={c.ink} />
      <circle cx="42" cy="37" r="2" fill={c.newsprint} stroke="none" />
    </Panel>
  );
}

export function TelevisionGlyph() {
  return (
    <Panel background={c.peach}>
      <path d="M31 9L48 27L67 10M27 80l-5 8M70 80l5 8" fill="none" />
      <rect x="10" y="27" width="77" height="53" rx="6" fill={c.red} />
      <rect x="17" y="34" width="50" height="37" rx="8" fill={c.newsprint} />
      <path d="M36 41L53 53L36 64Z" fill={c.ink} strokeWidth="1.5" />
      <circle cx="77" cy="43" r="4" fill={c.mustard} />
      <circle cx="77" cy="57" r="4" fill={c.mustard} />
      <path d="M73 69h8M73 73h8" fill="none" strokeWidth="1.3" />
    </Panel>
  );
}

export function HelmetGlyph() {
  return (
    <Panel background={c.sepia}>
      <path d="M12 78L85 12M7 58L59 6" fill="none" stroke={c.peach} strokeWidth="2" />
      <path d="M20 58Q17 21 48 20Q80 20 77 58Z" fill={c.mustard} />
      <path d="M49 21Q69 28 67 56H77Q79 23 49 21Z" fill={c.ink} />
      <path d="M12 57Q48 49 84 57L82 66Q48 72 14 66Z" fill={c.mustard} />
      <path d="M27 68Q27 89 52 83L69 68" fill="none" stroke={c.newsprint} strokeWidth="4" />
      <path d="M29 39L33 32M30 48L38 30M37 47L44 28" fill="none" strokeWidth="1" />
    </Panel>
  );
}

export function WesternGlyph() {
  return (
    <Panel background={c.mustard}>
      <path d="M5 72H91V90H5Z" fill={c.red} stroke="none" />
      <path d="M26 60L32 26Q40 18 48 30Q57 17 65 26L73 61Z" fill={c.peach} />
      <path d="M31 45Q48 51 68 45L71 57Q47 66 28 57Z" fill={c.red} />
      <path d="M8 54Q20 68 45 62Q73 68 88 51Q94 74 61 77Q16 83 8 54Z" fill={c.peach} />
      <path d="M16 68Q47 82 84 62" fill="none" stroke={c.sepia} strokeWidth="2" />
      <path d="M47 48L49 53L55 53L51 57L52 62L47 59L42 62L43 57L39 53L45 53Z" fill={c.mustard} strokeWidth="1" />
    </Panel>
  );
}
