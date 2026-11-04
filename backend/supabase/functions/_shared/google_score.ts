// Google Score: a 0–100 snapshot of how strong a business looks on Google.
// Inputs come from the owner's connected Business Profile (Phase 3).
// Kept server-side so the formula can change without an app release.

export type PlaceFacts = {
  rating: number | null;
  ratingCount: number;
  photoCount: number; // Places returns at most 10 photo refs
  hasHours: boolean;
  hasWebsite: boolean;
  hasPhone: boolean;
  isOperational: boolean;
};

export type ScoreItem = {
  key: string;
  label: string;
  earned: number;
  max: number;
  tip: string | null;
};

export function computeGoogleScore(f: PlaceFacts): { score: number; items: ScoreItem[] } {
  const rating = f.rating ?? 0;
  const ratingPts = f.ratingCount === 0 ? 0 : rating >= 4.5 ? 25 : rating >= 4.0 ? 18 : rating >= 3.5 ? 10 : 4;
  const countPts = f.ratingCount >= 100 ? 25 : f.ratingCount >= 50 ? 20 : f.ratingCount >= 20 ? 14
    : f.ratingCount >= 5 ? 8 : f.ratingCount >= 1 ? 4 : 0;
  const photoPts = f.photoCount >= 10 ? 15 : f.photoCount >= 3 ? 9 : f.photoCount >= 1 ? 4 : 0;

  const items: ScoreItem[] = [
    {
      key: "rating",
      label: f.ratingCount === 0 ? "Rating" : `Rating (${rating.toFixed(1)}★)`,
      earned: ratingPts,
      max: 25,
      tip: ratingPts < 25 ? "Ask every happy customer for a review — steady new reviews lift your average." : null,
    },
    {
      key: "reviews",
      label: `Number of reviews (${f.ratingCount})`,
      earned: countPts,
      max: 25,
      tip: countPts < 25 ? "Aim for 100+ reviews. Share your QR code and WhatsApp link after every visit." : null,
    },
    {
      key: "photos",
      label: "Photos",
      earned: photoPts,
      max: 15,
      tip: photoPts < 15 ? "Add at least 10 clear photos of your shop, products and team." : null,
    },
    {
      key: "hours",
      label: "Opening hours",
      earned: f.hasHours ? 10 : 0,
      max: 10,
      tip: f.hasHours ? null : "Add your opening hours so customers know when to visit.",
    },
    {
      key: "website",
      label: "Website",
      earned: f.hasWebsite ? 10 : 0,
      max: 10,
      tip: f.hasWebsite ? null : "Add a website or social media page link.",
    },
    {
      key: "phone",
      label: "Phone number",
      earned: f.hasPhone ? 10 : 0,
      max: 10,
      tip: f.hasPhone ? null : "Add a phone number customers can call.",
    },
    {
      key: "status",
      label: "Shown as open for business",
      earned: f.isOperational ? 5 : 0,
      max: 5,
      tip: f.isOperational ? null : "Google shows your business as closed — check your profile status.",
    },
  ];

  return { score: items.reduce((sum, i) => sum + i.earned, 0), items };
}
