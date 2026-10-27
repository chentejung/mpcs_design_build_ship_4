"use client";
// Pulp's motifs: The Bijou's cover in the hero, the ringed planet as brand mark, Krakoom!'s blast as an ornament,
// Look!'s pointing hand under an empty balloon for empty states, and THE END above every page's footer.
import { PulpCover, TheEnd } from "./pulp/cover";
import { Blast } from "./pulp/krakoom";
import { LookPanel } from "./pulp/look";
import { PlanetMark } from "./pulp/weird-space-tales";

// The big decoration beside a page's hero heading; `wide` is the banner above it on phones.
export function HeroMotif({ wide = false }: { wide?: boolean }) {
  return <PulpCover wide={wide} className={`ds-cover ${wide ? "block w-full" : "block w-56 md:w-64 lg:w-72"}`} />;
}

// Small ornament before a section heading or eyebrow.
export function Ornament() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 shrink-0"><Blast cx={12} cy={12} r={11} w={1.3} rubble={false} /></svg>;
}

// The heading is set inside Look!'s balloon, over the drawing, so it stays real text.
function LookBalloon({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto mb-3 w-full max-w-sm">
      <LookPanel className="block w-full" />
      <div className="absolute top-[9%] right-[5%] left-[15%] h-[52%] grid place-items-center px-[6%] text-center">{children}</div>
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="ds-empty">
      <LookBalloon><p className="ds-heading text-2xl md:text-3xl">{title}</p></LookBalloon>
      {children && <p className="ds-body ds-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// The brand mark before the site's name: the ringed planet.
export function BrandMark() {
  return (
    <span aria-hidden className="ds-brand-mark">
      <PlanetMark className="h-full w-full" />
    </span>
  );
}

// The closing illustration above a page's footer: THE END.
export function SignOff() {
  return <div aria-hidden className="ds-sign-off"><TheEnd className="block h-full w-full" /></div>;
}
