/// An owner's business, as stored in `public.businesses`.
class Business {
  const Business({
    required this.id,
    required this.ownerId,
    required this.name,
    required this.publicSlug,
    this.category,
    this.city,
    this.address,
    this.googlePlaceId,
    this.googleReviewUrl,
    this.products = const [],
    this.reviewLanguages = const ['en'],
    this.replyTone = 'friendly',
  });

  final String id;
  final String ownerId;
  final String name;
  final String publicSlug;
  final String? category;
  final String? city;
  final String? address;
  final String? googlePlaceId;
  final String? googleReviewUrl;
  final List<String> products;
  final List<String> reviewLanguages;
  final String replyTone;

  factory Business.fromJson(Map<String, dynamic> json) => Business(
        id: json['id'] as String,
        ownerId: json['owner_id'] as String,
        name: json['name'] as String,
        publicSlug: json['public_slug'] as String,
        category: json['category'] as String?,
        city: json['city'] as String?,
        address: json['address'] as String?,
        googlePlaceId: json['google_place_id'] as String?,
        googleReviewUrl: json['google_review_url'] as String?,
        products: (json['products'] as List?)?.cast<String>() ?? const [],
        reviewLanguages: (json['review_languages'] as List?)?.cast<String>() ?? const ['en'],
        replyTone: json['reply_tone'] as String? ?? 'friendly',
      );
}
