"use client";
// A film's poster in its 2:3 frame. The fallback (title on Surface) sits behind the image, so it shows while the
// poster loads and stays if the poster fails. `force` pins the loading or error state.
import { useEffect, useRef, useState } from "react";

type PosterState = "loading" | "loaded" | "error";

export function Poster({ title, year, src, force }: { title: string; year?: number; src?: string; force?: "loading" | "error" }) {
  const [state, setState] = useState<PosterState>(src ? "loading" : "error");
  const img = useRef<HTMLImageElement>(null);

  // An image that settled before hydration fired its load/error event too early for React; read it directly.
  useEffect(() => {
    const el = img.current;
    if (el?.complete) setState(el.naturalWidth ? "loaded" : "error");
  }, []);

  const shown = force ?? state;
  return (
    <div className="ds-poster" data-poster={shown}>
      <div aria-hidden className="ds-poster-fallback">
        <span className="ds-heading">{title}</span>
        <span className="ds-meta">{shown === "error" ? "⚠ Poster didn’t load" : year}</span>
      </div>
      {src && force !== "loading" && (
        // eslint-disable-next-line @next/next/no-img-element -- posters load straight from TMDB's image CDN
        <img
          ref={img}
          src={force === "error" ? undefined : src}
          alt={`Poster for ${title}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
        />
      )}
    </div>
  );
}
