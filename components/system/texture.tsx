"use client";
// Pulp's background, pinned to the viewport: a cheap magazine's Newsprint fibres, toned to Peach at the edges,
// freckled with Sepia foxing, under a coarse Sepia halftone that thickens toward the corners.
import { useId } from "react";
import { colors as c } from "@/lib/pulp";
import { Dots, Grain } from "./pulp/print";

export function Texture() {
  const uid = useId().replace(/:/g, "");
  return (
    <svg aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full">
      <defs>
        <Grain id={`${uid}-fibre`} grain={0.34} seed={6} frequency="0.06 0.7" />
        <filter id={`${uid}-fox`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed={11} />
          <feColorMatrix values="0 0 0 0 0.36  0 0 0 0 0.29  0 0 0 0 0.24  9 0 0 0 -6.1" />
        </filter>
        <radialGradient id={`${uid}-tone`} cx="50%" cy="45%" r="75%">
          <stop offset="50%" stopColor={c.peach} stopOpacity="0" />
          <stop offset="100%" stopColor={c.peach} stopOpacity="0.6" />
        </radialGradient>
        <radialGradient id={`${uid}-fade`} cx="50%" cy="45%" r="72%">
          <stop offset="58%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#fff" stopOpacity="1" />
        </radialGradient>
        <mask id={`${uid}-edge`}><rect width="100%" height="100%" fill={`url(#${uid}-fade)`} /></mask>
        <Dots id={`${uid}-screen`} color={c.sepia} r={1.7} gap={7} angle={45} />
      </defs>
      <rect width="100%" height="100%" fill={`url(#${uid}-tone)`} />
      <rect width="100%" height="100%" filter={`url(#${uid}-fox)`} opacity="0.1" />
      <rect width="100%" height="100%" fill={`url(#${uid}-screen)`} mask={`url(#${uid}-edge)`} opacity="0.24" />
      <rect width="100%" height="100%" filter={`url(#${uid}-fibre)`} style={{ mixBlendMode: "multiply" }} />
    </svg>
  );
}
