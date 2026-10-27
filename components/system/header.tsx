// The masthead: the Bijou's marquee, brand at the left and the page's actions at the right.
import { BrandMark } from "./motifs";

export const SITE_NAME = "The Bijou";

export function HeaderBar({ brand, action }: { brand: React.ReactNode; action?: React.ReactNode }) {
  return (
    <header className="ds-header">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-[5vw] py-3">
        {brand}
        {action}
      </div>
    </header>
  );
}

export function Brand() {
  return (
    <>
      <BrandMark />
      <span className="ds-brand-name ds-heading text-xl leading-none">{SITE_NAME}</span>
    </>
  );
}
