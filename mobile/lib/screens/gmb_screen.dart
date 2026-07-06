import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../config.dart';
import '../services/business_service.dart';
import '../services/gmb_service.dart';
import '../widgets/ui.dart';

class GmbScreen extends StatefulWidget {
  const GmbScreen({super.key, required this.business});

  final Business business;

  @override
  State<GmbScreen> createState() => _GmbScreenState();
}

class _GmbScreenState extends State<GmbScreen> {
  bool _loadingStatus = true;
  bool _connecting = false;
  bool _syncing = false;
  bool _posting = false;
  bool _optimizing = false;
  GmbStatus _status = const GmbStatus(connected: false);
  List<GmbLocation> _pickerOptions = [];
  int? _healthScore;
  Map<String, dynamic> _healthDetails = {};
  List<Map<String, dynamic>> _reviews = [];
  Map<String, dynamic>? _profile;
  List<String> _optimizations = [];
  String _postType = 'UPDATE';
  final _postText = TextEditingController();
  String? _replyingTo;
  final _replyText = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadStatus();
  }

  @override
  void dispose() {
    _postText.dispose();
    _replyText.dispose();
    super.dispose();
  }

  Future<void> _loadStatus() async {
    setState(() => _loadingStatus = true);
    try {
      _status = await GmbService.getStatus();
      if (_status.connected) _syncData();
    } catch (_) {}
    if (mounted) setState(() => _loadingStatus = false);
  }

  Future<void> _connect() async {
    setState(() => _connecting = true);
    try {
      final locations = await GmbService.startConnect();
      if (locations.isEmpty) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No Google Business locations found on that account.')));
        setState(() => _connecting = false);
        return;
      }
      if (locations.length == 1) {
        await _selectLocation(locations.first);
      } else {
        setState(() {
          _pickerOptions = locations;
          _connecting = false;
        });
      }
    } on GoogleSignInException catch (e) {
      if (mounted && e.code != GoogleSignInExceptionCode.canceled) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not connect to Google. Please try again.')));
      }
      setState(() => _connecting = false);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
      }
      setState(() => _connecting = false);
    }
  }

  Future<void> _selectLocation(GmbLocation loc) async {
    setState(() => _connecting = true);
    try {
      await GmbService.selectLocation(loc);
      setState(() {
        _status = GmbStatus(connected: true, locationId: loc.locationId, locationName: loc.locationName);
        _pickerOptions = [];
        _connecting = false;
      });
      _syncData();
    } catch (_) {
      setState(() => _connecting = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not save location. Please try again.')));
    }
  }

  Future<void> _syncData() async {
    setState(() => _syncing = true);
    try {
      final results = await Future.wait([GmbService.listReviews(), GmbService.getHealthScore(), GmbService.getProfile()]);
      _reviews = results[0] as List<Map<String, dynamic>>;
      final health = results[1] as (int?, Map<String, dynamic>);
      _healthScore = health.$1;
      _healthDetails = health.$2;
      _profile = results[2] as Map<String, dynamic>?;
    } catch (_) {
    } finally {
      if (mounted) setState(() => _syncing = false);
    }
  }

  Future<void> _disconnect() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Disconnect Google Business?'),
        content: const Text('Your cached reviews will be cleared.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Disconnect')),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await GmbService.disconnect();
    } catch (_) {}
    setState(() {
      _status = const GmbStatus(connected: false);
      _reviews = [];
      _healthScore = null;
      _profile = null;
    });
  }

  Future<void> _post() async {
    if (_postText.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('⚠ Please write something to post')));
      return;
    }
    setState(() => _posting = true);
    try {
      final ok = await GmbService.createLocalPost(text: _postText.text.trim(), postType: _postType);
      if (ok) {
        _postText.clear();
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✓ Posted to Google Business Profile!')));
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not post to Google. Please try again.')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Post failed: ${e.toString().replaceFirst('Exception: ', '')}')));
    } finally {
      if (mounted) setState(() => _posting = false);
    }
  }

  Future<void> _optimizeDescription() async {
    setState(() => _optimizing = true);
    try {
      final desc = _profile?['profile']?['description'] ?? _profile?['description'] ?? '';
      final results = await GmbService.optimizeDescription(
        currentDescription: desc.toString(),
        businessName: widget.business.name,
        category: widget.business.category,
        city: widget.business.city,
        services: widget.business.services,
        keywords: widget.business.keywords,
      );
      setState(() => _optimizations = results);
      if (results.isEmpty && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not generate descriptions.')));
      }
    } finally {
      if (mounted) setState(() => _optimizing = false);
    }
  }

  Future<void> _submitReply(String reviewName) async {
    final comment = _replyText.text.trim();
    if (comment.isEmpty) return;
    try {
      await GmbService.postReply(reviewName: reviewName, comment: comment);
      setState(() {
        _reviews = _reviews.map((r) => r['name'] == reviewName ? {...r, 'reply_comment': comment} : r).toList();
        _replyingTo = null;
        _replyText.clear();
      });
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✓ Reply posted to Google!')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not post reply: ${e.toString().replaceFirst('Exception: ', '')}')));
    }
  }

  static const _starMap = {'FIVE': 5, 'FOUR': 4, 'THREE': 3, 'TWO': 2, 'ONE': 1};

  @override
  Widget build(BuildContext context) {
    if (_loadingStatus) return const Center(child: CircularProgressIndicator());
    if (_pickerOptions.isNotEmpty) return _locationPicker();
    return _status.connected ? _connectedView() : _notConnectedView();
  }

  Widget _notConnectedView() {
    const features = [
      (Icons.bar_chart_rounded, 'Health Score', 'See a 0-100 score based on profile completeness, ratings, and response rate'),
      (Icons.star_rounded, 'Reviews Inbox', 'Read all your Google reviews without opening another app'),
      (Icons.auto_awesome_rounded, 'AI Reply', 'Generate and post professional replies to reviews directly from RevYne'),
      (Icons.auto_fix_high_rounded, 'SEO Optimizer', 'Get AI-generated descriptions that rank higher on Google Search'),
    ];
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.margin),
        children: [
          const SizedBox(height: 12),
          Center(
            child: Container(
              width: 76,
              height: 76,
              decoration: const BoxDecoration(color: AppColors.surfaceContainerLow, shape: BoxShape.circle),
              child: const Icon(Icons.g_mobiledata_rounded, color: Color(0xFF4285F4), size: 44),
            ),
          ),
          const SizedBox(height: 16),
          const Text('Connect Google Business', textAlign: TextAlign.center, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text('Link your Google Business Profile to unlock powerful features — all in one place.',
              textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade600)),
          const SizedBox(height: 20),
          for (final (icon, title, desc) in features)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: AppCard(
                padding: const EdgeInsets.all(14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(icon, color: AppColors.primaryContainer, size: 22),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 2),
                          Text(desc, style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          FilledButton.icon(
            onPressed: _connecting ? null : _connect,
            icon: _connecting
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.g_mobiledata_rounded),
            label: Text(_connecting ? 'Connecting…' : 'Connect with Google'),
          ),
          const SizedBox(height: 10),
          Text(
            "You'll be asked to sign into Google and grant access to your Business Profile. RevYne never posts or modifies anything without your confirmation.",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
          ),
        ],
      ),
    );
  }

  Widget _locationPicker() {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.margin),
        children: [
          const Text('Choose Your Business', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text('Select the Google Business Profile you want to connect to RevYne.', style: TextStyle(color: Colors.grey.shade600)),
          const SizedBox(height: 16),
          for (final loc in _pickerOptions)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: InkWell(
                onTap: () => _selectLocation(loc),
                borderRadius: BorderRadius.circular(AppRadius.card),
                child: AppCard(
                  child: Row(
                    children: [
                      const Icon(Icons.location_on_outlined, color: AppColors.primaryContainer),
                      const SizedBox(width: 12),
                      Expanded(child: Text(loc.locationName, style: const TextStyle(fontWeight: FontWeight.w600))),
                      const Icon(Icons.chevron_right_rounded),
                    ],
                  ),
                ),
              ),
            ),
          const SizedBox(height: 8),
          OutlinedButton(onPressed: () => setState(() => _pickerOptions = []), child: const Text('Cancel')),
        ],
      ),
    );
  }

  Widget _connectedView() {
    final tips = _healthDetails.values.where((d) => d is Map && d['tip'] != null).take(3).toList();
    final currentDesc = (_profile?['profile']?['description'] ?? _profile?['description'] ?? '').toString();

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: _syncData,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.margin),
          children: [
            Row(
              children: [
                const Icon(Icons.location_on_rounded, color: AppColors.primaryContainer, size: 18),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(_status.locationName ?? 'Google Business', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                StatusPill(label: 'CONNECTED', background: AppColors.successContainer, foreground: AppColors.success, dot: true),
                const Spacer(),
                TextButton.icon(
                  onPressed: _syncing ? null : _syncData,
                  icon: const Icon(Icons.sync_rounded, size: 16),
                  label: Text(_syncing ? 'Syncing…' : 'Sync'),
                ),
                TextButton.icon(
                  onPressed: _disconnect,
                  style: TextButton.styleFrom(foregroundColor: AppColors.error),
                  icon: const Icon(Icons.link_off_rounded, size: 16),
                  label: const Text('Disconnect'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            AppCard(
              child: Row(
                children: [
                  ScoreRing(score: _healthScore),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _healthScore == null ? 'Loading…' : (_healthScore! >= 80 ? 'Excellent' : _healthScore! >= 55 ? 'Good' : 'Needs Work'),
                          style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFFB45309)),
                        ),
                        const SizedBox(height: 2),
                        const Text('Your business profile completeness is below average.', style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
                        const SizedBox(height: 10),
                        if (tips.isNotEmpty)
                          TextButton(
                            onPressed: () => _showTips(tips),
                            style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                            child: Text('View ${tips.length} tip${tips.length > 1 ? 's' : ''} →'),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      for (final t in const ['UPDATE', 'OFFER', 'EVENT'])
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: SelectChip(label: t[0] + t.substring(1).toLowerCase(), dense: true, selected: _postType == t, onTap: () => setState(() => _postType = t)),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _postText,
                    maxLines: 3,
                    maxLength: 1500,
                    decoration: const InputDecoration(hintText: "Share what's new with your customers…"),
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {},
                          icon: const Icon(Icons.add_a_photo_outlined, size: 16),
                          label: const Text('Add Photo'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: FilledButton(
                          onPressed: _posting ? null : _post,
                          child: Text(_posting ? 'Posting…' : 'Post to Google Business'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppCard(
              color: AppColors.surfaceContainerLow,
              borderColor: Colors.transparent,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.auto_awesome_rounded, color: AppColors.primaryContainer, size: 18),
                      SizedBox(width: 8),
                      Text('AI SEO Description', style: TextStyle(fontWeight: FontWeight.w800)),
                    ],
                  ),
                  if (currentDesc.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Text('"$currentDesc"', style: const TextStyle(fontStyle: FontStyle.italic, fontSize: 13)),
                  ],
                  if (_optimizations.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    for (final desc in _optimizations)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: AppCard(
                          padding: const EdgeInsets.all(12),
                          child: Text(desc, style: const TextStyle(fontSize: 13)),
                        ),
                      ),
                  ],
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: _optimizing ? null : _optimizeDescription,
                    child: Text(_optimizing ? 'Generating…' : 'Generate SEO Description'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SectionHeader(title: 'Customer Reviews', action: null),
            const SizedBox(height: 4),
            Text('${_reviews.length} Total', style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
            const SizedBox(height: 10),
            if (_reviews.isEmpty)
              EmptyState(title: 'No reviews loaded yet', body: 'Tap Sync to pull your latest Google reviews.', icon: Icons.rate_review_outlined)
            else
              for (final r in _reviews) _reviewCard(r),
            const SizedBox(height: 12),
            Center(
              child: OutlinedButton(
                onPressed: _disconnect,
                style: OutlinedButton.styleFrom(foregroundColor: AppColors.error, side: const BorderSide(color: AppColors.error)),
                child: const Text('Disconnect Google Business'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _reviewCard(Map<String, dynamic> r) {
    final stars = _starMap[r['starRating']] ?? 0;
    final replyText = (r['reviewReply']?['comment'] ?? r['reply_comment'] ?? '').toString();
    final hasReply = replyText.isNotEmpty;
    final isReplying = _replyingTo == r['name'];
    final name = (r['reviewer']?['displayName'] ?? r['reviewer_name'] ?? 'Anonymous').toString();

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(radius: 16, backgroundColor: AppColors.surfaceContainerHigh, child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?')),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                      Row(children: List.generate(5, (i) => Icon(i < stars ? Icons.star_rounded : Icons.star_outline_rounded, size: 13, color: const Color(0xFFFBBC05)))),
                    ],
                  ),
                ),
                if (hasReply) StatusPill(label: 'REPLIED', background: AppColors.successContainer, foreground: AppColors.success),
              ],
            ),
            if ((r['comment'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(r['comment'].toString(), style: const TextStyle(fontSize: 13)),
            ],
            if (hasReply && !isReplying) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: AppColors.successContainer.withValues(alpha: 0.4), borderRadius: BorderRadius.circular(10)),
                child: Text('"$replyText"', style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic)),
              ),
            ],
            if (isReplying) ...[
              const SizedBox(height: 10),
              TextField(controller: _replyText, maxLines: 3, decoration: const InputDecoration(hintText: 'Write your reply…')),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () async {
                        final draft = await GmbService.generateReplyDraft(
                          reviewText: r['comment']?.toString() ?? '',
                          rating: stars,
                          business: {
                            'name': widget.business.name,
                            'category': widget.business.category,
                            'city': widget.business.city,
                            'language': widget.business.language,
                            'tone': widget.business.tone,
                          },
                        );
                        if (draft.isNotEmpty) _replyText.text = draft;
                      },
                      child: const Text('✦ AI Draft'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(child: FilledButton(onPressed: () => _submitReply(r['name'].toString()), child: const Text('Post Reply'))),
                ],
              ),
            ] else
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: OutlinedButton(
                  onPressed: () => setState(() {
                    _replyingTo = r['name'].toString();
                    _replyText.text = replyText;
                  }),
                  child: Text(hasReply ? 'Edit Reply' : '✦ Reply'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showTips(List tips) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('💡 Improvement Tips', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            const SizedBox(height: 12),
            for (final t in tips) Padding(padding: const EdgeInsets.only(bottom: 8), child: Text('• ${t['tip']}')),
          ],
        ),
      ),
    );
  }
}
