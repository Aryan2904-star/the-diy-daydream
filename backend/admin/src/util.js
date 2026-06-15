export const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

export function priceRange(options) {
  const prices = (options || []).map((o) => o.price).filter(Number.isFinite);
  if (!prices.length) return "—";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? inr(min) : `${inr(min)} – ${inr(max)}`;
}

export const BADGES = [
  { value: "none", label: "No badge" },
  { value: "best", label: "Bestseller" },
  { value: "new", label: "New" },
  { value: "pop", label: "Popular" },
];

// Inline-SVG fallback styles available on the frontend (used when no image).
export const ART_STYLES = [
  "gift",
  "bouquet",
  "paper",
  "choco",
  "shadowbox",
  "explosion",
  "bespoke",
];

export const badgeText = { best: "Bestseller", new: "New", pop: "Popular" };
