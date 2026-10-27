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
