import { pulp, systemStyle } from "@/lib/pulp";
import { Texture } from "./texture";

// Wraps the site in the Pulp Design System: its colors, fonts and shapes as --ds-* variables, plus its paper.
// systemStyle() fails the build if the system misses a contrast target.
export function SystemTheme({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div data-system={pulp.id} style={systemStyle(pulp)} className={`ds ${className}`}>
      <Texture />
      {children}
    </div>
  );
}
