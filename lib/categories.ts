// The Pulp kit's genre art: one pop-art panel and badge tint per Category (components/system/pulp/genre.tsx).
// Carried over from Week 2; TMDB genres are matched to them when Browse lands (#11).
export const categories = [
  { id: "thriller", label: "Thriller" },
  { id: "comedy", label: "Comedy" },
  { id: "animation", label: "Animation" },
  { id: "action", label: "Action" },
  { id: "science-fiction", label: "Sci-Fi" },
  { id: "romance", label: "Romance" },
  { id: "horror", label: "Horror" },
] as const;

export type Category = (typeof categories)[number]["id"];

export const categoryLabel = Object.fromEntries(categories.map((c) => [c.id, c.label])) as Record<Category, string>;

// TMDB genre ids that have Pulp art; other genres show their name without a panel.
export const categoryByGenre: Record<number, Category> = {
  53: "thriller", 35: "comedy", 16: "animation", 28: "action", 878: "science-fiction", 10749: "romance", 27: "horror",
};

// A film's badge: the first of its genres that has art.
export const categoryFor = (genreIds: number[]) => genreIds.map((id) => categoryByGenre[id]).find(Boolean);
