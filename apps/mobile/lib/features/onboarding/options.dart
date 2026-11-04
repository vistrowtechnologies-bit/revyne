/// Languages customers can write their review in. Codes are stored in
/// `businesses.review_languages` (max 10).
const reviewLanguageOptions = <(String code, String label)>[
  ('en', 'English'),
  ('hi', 'Hindi'),
  ('hinglish', 'Hinglish'),
  ('mr', 'Marathi'),
  ('gu', 'Gujarati'),
  ('ta', 'Tamil'),
  ('te', 'Telugu'),
  ('kn', 'Kannada'),
  ('ml', 'Malayalam'),
  ('bn', 'Bengali'),
  ('pa', 'Punjabi'),
  ('or', 'Odia'),
  ('ur', 'Urdu'),
];

/// Matches the `reply_tone` check constraint.
const replyToneOptions = <(String value, String label, String example)>[
  ('friendly', 'Friendly', 'Thank you so much! See you again soon 😊'),
  ('professional', 'Professional', 'Thank you for your feedback. We appreciate your visit.'),
  ('warm', 'Warm', 'This made our day — thank you for choosing us!'),
  ('formal', 'Formal', 'We sincerely thank you for your valuable review.'),
];

/// Used when a business is added by hand (not found on Google).
const businessCategoryOptions = [
  'Restaurant', 'Cafe', 'Salon & Beauty', 'Clinic & Healthcare', 'Gym & Fitness',
  'Retail Store', 'Electronics', 'Jewellery', 'Hotel & Stay', 'Education & Coaching',
  'Car & Bike Service', 'Home Services', 'Real Estate', 'Travel', 'Optical Store',
  'Event Services', 'Professional Services', 'Other',
];

const maxProducts = 20;
const maxReviewLanguages = 10;
