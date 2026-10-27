// TMDB is the source of every film's data and poster; its terms ask for the logo and this exact notice.
export function Credits() {
  return (
    <section aria-labelledby="credits" className="ds-credits mt-20 border-t-2 border-(--ds-border) pt-10">
      <h2 id="credits" className="ds-heading text-2xl">Credits</h2>
      <p className="ds-body ds-muted mt-2 max-w-2xl">
        Film data and posters come from TMDB, for a non-commercial class project. TMDB does not claim ownership of the images.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <a href="https://www.themoviedb.org" target="_blank" rel="noopener" aria-label="TMDB home">
          {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size SVG logo needs no optimizing */}
          <img src="/bijou/tmdb-logo.svg" alt="TMDB" width="88" height="32" />
        </a>
        <p className="ds-fine ds-muted">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      </div>
    </section>
  );
}
