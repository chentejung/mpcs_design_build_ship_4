"use client";
import { buttonClass } from "@/components/system/controls";
export default function PageError({ reset }: { reset: () => void }) {
  return <section className="py-12">
    <h1 className="ds-kicker">The projector needs a moment.</h1>
    <p className="ds-body my-4">We couldn’t load this page. Please try again.</p>
    <button className={buttonClass("primary")} onClick={reset}>Try again</button>
  </section>;
}
