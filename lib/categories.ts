// The Pulp kit's genre art: one pop-art panel and badge tint per Category (components/system/pulp/genre.tsx).
// Every TMDB movie genre has its own panel, including the original seven from Week 2.
export const categories = [
  { id: "thriller", label: "Thriller" },
  { id: "comedy", label: "Comedy" },
  { id: "animation", label: "Animation" },
  { id: "action", label: "Action" },
  { id: "science-fiction", label: "Sci-Fi" },
  { id: "romance", label: "Romance" },
  { id: "horror", label: "Horror" },
  { id: "adventure", label: "Adventure" },
  { id: "crime", label: "Crime" },
  { id: "documentary", label: "Documentary" },
  { id: "drama", label: "Drama" },
  { id: "family", label: "Family" },
  { id: "fantasy", label: "Fantasy" },
  { id: "history", label: "History" },
  { id: "music", label: "Music" },
  { id: "mystery", label: "Mystery" },
  { id: "tv-movie", label: "TV Movie" },
  { id: "war", label: "War" },
  { id: "western", label: "Western" },
] as const;

export type Category = (typeof categories)[number]["id"];

export const categoryLabel = Object.fromEntries(categories.map((c) => [c.id, c.label])) as Record<Category, string>;

// TMDB's movie genre ids. Unknown future genres still keep their text label.
export const categoryByGenre: Record<number, Category> = {
  53: "thriller", 35: "comedy", 16: "animation", 28: "action", 878: "science-fiction", 10749: "romance", 27: "horror",
  12: "adventure", 80: "crime", 99: "documentary", 18: "drama", 10751: "family", 14: "fantasy", 36: "history",
  10402: "music", 9648: "mystery", 10770: "tv-movie", 10752: "war", 37: "western",
};

// A film's badge: the first of its genres that has art.
export const categoryFor = (genreIds: number[]) => genreIds.map((id) => categoryByGenre[id]).find(Boolean);
