// One Film: poster in Pulp's frame with its Category badge, title, original title, year · runtime · genres, synopsis
// (3 lines at most on phones), and an action (Save or Remove). Once Save is pressed, the HELD OVER! snipe lands on
// the poster (app/system.css shows it with :has).
import type { Category } from "@/lib/categories";
import { CategoryBadge, type FrozenState } from "./controls";
import { Poster } from "./poster";

export type CardFilm = {
  title: string;
  original?: { title: string; lang: string }; // shown when it differs from the title
  year?: number;
  runtime?: number; // minutes
  genres?: string[];
  category?: Category;
  synopsis?: string;
  poster?: string; // image URL
};

const formatRuntime = (min: number) => `${Math.floor(min / 60)}h ${min % 60}m`;

export function FilmCard({ film, action, headingLevel = 2, state, poster, showSynopsis = true }: {
  film: CardFilm;
  action?: React.ReactNode;
  headingLevel?: 2 | 3 | 4;
  state?: FrozenState;
  poster?: "loading" | "error";
  showSynopsis?: boolean;
}) {
  const Heading = `h${headingLevel}` as const;
  const meta = [film.year, film.runtime && formatRuntime(film.runtime), film.genres?.join(", ")].filter(Boolean).join(" · ");
  return (
    <article className="ds-card" data-state={state}>
      <div className="ds-frame">
        <Poster title={film.title} year={film.year} src={film.poster} force={poster} />
        {film.category && <CategoryBadge category={film.category} className="ds-category" />}
        <span aria-hidden className="ds-saved-stamp" />
      </div>
      <Heading className="ds-card-title ds-heading">{film.title}</Heading>
      {film.original && <p lang={film.original.lang} className="ds-card-native ds-native">{film.original.title}</p>}
      {meta && <p className="ds-card-meta ds-meta">{meta}</p>}
      {showSynopsis && film.synopsis && <p className="ds-card-synopsis ds-body">{film.synopsis}</p>}
      {action && <div className="ds-card-action">{action}</div>}
    </article>
  );
}
