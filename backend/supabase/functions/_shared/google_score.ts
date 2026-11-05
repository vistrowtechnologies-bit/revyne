// Google Score: a 0–100 snapshot of how complete and active a Business Profile
// is. Google's own "Profile strength" is not available through any API, so this
// mirrors what it rewards: a filled-in profile, steady reviews, replies, photos
// and recent posts. Kept server-side so the formula can change without an app
// release. Each item names the app screen that fixes it (`action`).

export type ProfileFacts = {
  rating: number | null;
  ratingCount: number;
  repliedShare: number | null; // replied / reviews checked; null when there are none
  hasDescription: boolean;
  hasHours: boolean;
  hasPhone: boolean;
  hasWebsite: boolean;
  additionalCategories: number;
  photoCount: number | null; // null when Google didn't say
  daysSinceLastPost: number | null; // null when never posted (or unknown)
};

export type ScoreAction = "description" | "hours" | "phone" | "website" | "get_reviews" | "reply" | "photos" | "posts" | null;

export type ScoreItem = {
  key: string;
  label: string;
  earned: number;
  max: number;
  tip: string | null;
  action: ScoreAction;
};

const item = (key: string, label: string, earned: number, max: number, tip: string, action: ScoreAction): ScoreItem => ({
  key,
  label,
  earned,
  max,
  tip: earned < max ? tip : null,
  action,
});

export function computeGoogleScore(f: ProfileFacts): { score: number; items: ScoreItem[] } {
  const rating = f.rating ?? 0;
  const ratingPts = f.ratingCount === 0 ? 0 : rating >= 4.5 ? 20 : rating >= 4.0 ? 15 : rating >= 3.5 ? 8 : 3;
  const countPts = f.ratingCount >= 100 ? 20 : f.ratingCount >= 50 ? 16 : f.ratingCount >= 20 ? 11
    : f.ratingCount >= 5 ? 6 : f.ratingCount >= 1 ? 3 : 0;
  const replyPts = f.repliedShare === null ? 0 : Math.round(10 * Math.min(1, f.repliedShare));
  const photos = f.photoCount ?? 0;
  const photoPts = photos >= 10 ? 10 : photos >= 3 ? 6 : photos >= 1 ? 3 : 0;
  const postPts = f.daysSinceLastPost === null ? 0 : f.daysSinceLastPost <= 7 ? 6 : f.daysSinceLastPost <= 30 ? 3 : 0;

  const items: ScoreItem[] = [
    item("rating", f.ratingCount === 0 ? "Rating" : `Rating (${rating.toFixed(1)}★)`, ratingPts, 20,
      "Ask every customer to share their experience — steady new reviews lift your average.", "get_reviews"),
    item("reviews", `Number of reviews (${f.ratingCount})`, countPts, 20,
      "Aim for 100+ reviews. Share your QR poster and WhatsApp link after every visit.", "get_reviews"),
    item("replies", "Replies to reviews", replyPts, 10,
      f.repliedShare === null ? "Reply to reviews as they come in — Google shows customers you care." : "Reply to every review, good or bad.",
      "reply"),
    item("description", "Business description", f.hasDescription ? 10 : 0, 10,
      "Add a description of what you do, so customers and Google understand your business.", "description"),
    item("photos", f.photoCount === null ? "Photos" : `Photos (${photos})`, photoPts, 10,
      "Add at least 10 clear photos of your shop, work and team.", "photos"),
    item("hours", "Opening hours", f.hasHours ? 8 : 0, 8, "Add your opening hours so customers know when to visit.", "hours"),
    item("posts", "Recent posts", postPts, 6, "Post an update or offer every week to stay fresh on Google.", "posts"),
    item("phone", "Phone number", f.hasPhone ? 6 : 0, 6, "Add a phone number customers can call.", "phone"),
    item("website", "Website", f.hasWebsite ? 6 : 0, 6, "Add a website or social media page link.", "website"),
    item("categories", "Extra categories", f.additionalCategories > 0 ? 4 : 0, 4,
      "Add other categories that describe your services in your Google profile.", null),
  ];

  return { score: items.reduce((sum, i) => sum + i.earned, 0), items };
}
