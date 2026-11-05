/// "just now", "5m ago", "3h ago", "2d ago", then "12 Oct".
String timeAgo(DateTime time, {DateTime? now}) {
  final diff = (now ?? DateTime.now()).difference(time.toLocal());
  if (diff.inMinutes < 1) return 'just now';
  if (diff.inHours < 1) return '${diff.inMinutes}m ago';
  if (diff.inDays < 1) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  final local = time.toLocal();
  return '${local.day} ${months[local.month - 1]}';
}

/// "Good morning" / "Good afternoon" / "Good evening" for the local hour.
String greeting(DateTime now) {
  final h = now.hour;
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/// First word of a full name, or null.
String? firstName(String? fullName) {
  final parts = (fullName ?? '').trim().split(RegExp(r'\s+'));
  return parts.first.isEmpty ? null : parts.first;
}

/// "★★★★☆" for a 1–5 rating.
String stars(int rating) => '★' * rating + '☆' * (5 - rating);
