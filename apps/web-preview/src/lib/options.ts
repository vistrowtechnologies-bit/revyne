// lib/features/onboarding/options.dart
export const REVIEW_LANGUAGES: [string, string][] = [
  ['en', 'English'], ['hi', 'Hindi'], ['hinglish', 'Hinglish'], ['mr', 'Marathi'], ['gu', 'Gujarati'],
  ['ta', 'Tamil'], ['te', 'Telugu'], ['kn', 'Kannada'], ['ml', 'Malayalam'], ['bn', 'Bengali'],
  ['pa', 'Punjabi'], ['or', 'Odia'], ['ur', 'Urdu'],
];

export const REPLY_TONES: [string, string, string][] = [
  ['friendly', 'Friendly', 'Thank you so much! See you again soon 😊'],
  ['professional', 'Professional', 'Thank you for your feedback. We appreciate your visit.'],
  ['warm', 'Warm', 'This made our day — thank you for choosing us!'],
  ['formal', 'Formal', 'We sincerely thank you for your valuable review.'],
];

export const MAX_PRODUCTS = 20;
export const MAX_REVIEW_LANGUAGES = 10;

/** Message shared with customers on WhatsApp — honest feedback only (review_link_card.dart). */
export function reviewRequestMessage(businessName: string, link: string, customerName?: string) {
  const n = (customerName ?? '').trim();
  return `Namaste${n ? ` ${n}` : ''}! Thank you for visiting ${businessName}. We'd love to hear about your experience: ${link}`;
}

/** Opens WhatsApp (wa.me) in a new tab, optionally to an Indian mobile number. */
export function openWhatsApp(text: string, phone?: string) {
  const digits = (phone ?? '').replace(/\D/g, '');
  const to = digits ? (digits.length === 10 ? `91${digits}` : digits) : '';
  window.open(`https://wa.me/${to}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}
