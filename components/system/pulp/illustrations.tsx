// Local illustration plates. SVG viewBoxes keep the drawing kit's original dimensions.
// The images already contain their ink grain; applying Newsprint again would erase fine hatching.
export type PulpIllustration =
  | "look-empty" | "rocket-engraved" | "planet-engraved" | "saucer-engraved"
  | "skyline-engraved" | "thriller-engraved" | "comedy-engraved" | "horror-engraved"
  | "action-engraved" | "romance-engraved" | "blast-engraved"
  | "adventure-engraved" | "crime-engraved" | "documentary-engraved" | "drama-engraved" | "family-engraved" | "fantasy-engraved" | "history-engraved" | "music-engraved" | "mystery-engraved" | "tv-movie-engraved" | "war-engraved" | "western-engraved";

export const illustrationPath = (name: PulpIllustration) => `/bijou/art/${name}.webp`;

export function IllustrationPlate({ name, viewBox, className = "h-full max-w-full" }: {
  name: PulpIllustration; viewBox: string; className?: string;
}) {
  const [x, y, width, height] = viewBox.split(" ").map(Number);
  return (
    <svg aria-hidden viewBox={viewBox} className={className}>
      <image href={illustrationPath(name)} x={x} y={y} width={width} height={height} preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}
