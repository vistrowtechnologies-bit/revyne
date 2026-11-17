import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/router.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import '../google_content/content_sections.dart';
import 'google_changes_sheet.dart';
import 'profile_editors.dart';
import 'profile_repository.dart';
import '../../core/widgets/skeleton.dart';

/// Opens the screen that fixes a score task or edits a profile field.
Future<void> openProfileAction(BuildContext context, WidgetRef ref, ScoreAction action, GbpProfile p) async {
  switch (action) {
    case ScoreAction.description:
      await showProfileEditor(context, DescriptionEditor(current: p.description));
    case ScoreAction.hours:
      await showProfileEditor(context, HoursEditor(current: p.hours, splitHours: p.splitHours));
    case ScoreAction.phone:
      await showProfileEditor(context, TextValueEditor.phone(current: p.phone));
    case ScoreAction.website:
      await showProfileEditor(context, TextValueEditor.website(current: p.website));
    case ScoreAction.getReviews:
      context.go(Routes.getReviews);
    case ScoreAction.reply:
      context.go(Routes.reviews);
    case ScoreAction.photos:
      await startAddPhoto(context, ref);
    case ScoreAction.posts:
      await startNewPost(context, ref);
    case ScoreAction.none:
      break;
  }
}

/// Google Score ring with the biggest open tasks.
class ScoreCard extends ConsumerStatefulWidget {
  const ScoreCard({super.key, required this.view});
  final ProfileView view;

  @override
  ConsumerState<ScoreCard> createState() => _ScoreCardState();
}

class _ScoreCardState extends ConsumerState<ScoreCard> {
  bool _all = false;

  @override
  Widget build(BuildContext context) {
    final v = widget.view;
    final tasks = v.tasks;
    final shown = _all ? tasks : tasks.take(3).toList();
    final verdict = v.score >= 80 ? 'Strong profile' : v.score >= 55 ? 'Good — a few quick wins left' : 'Room to grow';

    return AppCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ScoreRing(score: v.score, size: 76),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Google Score', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
                    const SizedBox(height: 2),
                    Text(verdict, style: const TextStyle(color: AppColors.muted, fontSize: 14.5)),
                    if (tasks.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text('${tasks.length} way${tasks.length == 1 ? '' : 's'} to improve',
                          style: TextStyle(color: AppColors.violet, fontWeight: FontWeight.w700, fontSize: 14)),
                    ],
                  ],
                ),
              ),
            ],
          ),
          if (shown.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            const Divider(),
            for (final t in shown) _TaskRow(task: t, onTap: () => openProfileAction(context, ref, t.action, v.profile)),
            if (tasks.length > 3)
              Center(
                child: TextButton(
                  onPressed: () => setState(() => _all = !_all),
                  child: Text(_all ? 'Show fewer' : 'Show all ${tasks.length}'),
                ),
              ),
          ],
          const SizedBox(height: 4),
          const Text(
            'RevYne\'s score, based on what Google rewards. Google\'s own "profile strength" isn\'t shared with apps.',
            style: TextStyle(color: AppColors.muted, fontSize: 12.5),
          ),
        ],
      ),
    );
  }
}

class _TaskRow extends StatelessWidget {
  const _TaskRow({required this.task, required this.onTap});
  final ScoreItem task;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: task.action == ScoreAction.none ? null : onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: AppColors.successSoft, borderRadius: BorderRadius.circular(AppRadius.chip)),
                child: Text('+${task.max - task.earned}', style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.w800, fontSize: 12.5)),
              ),
              const SizedBox(width: AppSpacing.gutter),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(task.label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                    if (task.tip != null) Text(task.tip!, style: const TextStyle(color: AppColors.muted, fontSize: 13.5)),
                  ],
                ),
              ),
              if (task.action != ScoreAction.none) const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
            ],
          ),
        ),
      );
}

/// What Google shows about the business, each row editable.
class ProfileDetails extends ConsumerWidget {
  const ProfileDetails({super.key, required this.profile});
  final GbpProfile profile;

  String _hoursSummary() {
    if (profile.hours.isEmpty) return 'Not set';
    final open = {for (final h in profile.hours) h.day};
    final first = profile.hours.first;
    final same = profile.hours.every((h) => h.open == first.open && h.close == first.close);
    final days = open.length == 7 ? 'Every day' : '${open.length} days a week';
    return same ? '$days · ${timeLabel(first.open)} – ${timeLabel(first.close)}' : '$days · varies by day';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p = profile;
    final rows = [
      (Icons.notes_rounded, 'Description', p.description.isEmpty ? 'Not set' : p.description, ScoreAction.description, p.description.isEmpty),
      (Icons.schedule_rounded, 'Opening hours', _hoursSummary(), ScoreAction.hours, p.hours.isEmpty),
      (Icons.event_busy_rounded, 'Holiday hours', p.specialHours.isEmpty ? 'None coming up' : '${p.specialHours.length} date${p.specialHours.length == 1 ? '' : 's'} set', null, false),
      (Icons.call_outlined, 'Phone', p.phone.isEmpty ? 'Not set' : p.phone, ScoreAction.phone, p.phone.isEmpty),
      (Icons.language_rounded, 'Website', p.website.isEmpty ? 'Not set' : p.website, ScoreAction.website, p.website.isEmpty),
    ];

    return AppCard(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        children: [
          if (p.hasPendingEdits)
            Container(
              margin: const EdgeInsets.fromLTRB(12, 8, 12, 4),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppColors.amberSoft, borderRadius: BorderRadius.circular(14)),
              child: const Row(children: [
                Icon(Icons.hourglass_top_rounded, size: 18, color: Color(0xFF8A5A00)),
                SizedBox(width: 8),
                Expanded(child: Text('Google is reviewing a recent change. It shows once approved.', style: TextStyle(fontSize: 13.5, color: Color(0xFF5C3D00)))),
              ]),
            ),
          if (p.googleUpdated)
            Container(
              margin: const EdgeInsets.fromLTRB(12, 8, 12, 4),
              padding: const EdgeInsets.fromLTRB(12, 10, 4, 10),
              decoration: BoxDecoration(color: AppColors.dangerSoft, borderRadius: BorderRadius.circular(14)),
              child: Row(children: [
                const Icon(Icons.info_outline_rounded, size: 18, color: AppColors.danger),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text('Google changed some of your details (often from public suggestions). Check they\'re right.',
                      style: TextStyle(fontSize: 13.5, color: AppColors.ink)),
                ),
                TextButton(onPressed: () => showGoogleChanges(context), child: const Text('Check')),
              ]),
            ),
          for (final (i, (icon, label, value, action, missing)) in rows.indexed) ...[
            if (i > 0) const Divider(indent: 56),
            ListTile(
              leading: Icon(icon, color: AppColors.violet),
              title: Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              subtitle: Text(value, maxLines: 2, overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: missing ? AppColors.danger : AppColors.muted, fontSize: 14)),
              trailing: const Icon(Icons.edit_outlined, size: 20, color: AppColors.muted),
              onTap: () => action == null
                  ? showProfileEditor(context, HolidayHoursEditor(current: p.specialHours))
                  : openProfileAction(context, ref, action, p),
            ),
          ],
          if (p.primaryCategory != null) ...[
            const Divider(indent: 56),
            ListTile(
              leading: Icon(Icons.category_outlined, color: AppColors.violet),
              title: const Text('Category', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              subtitle: Text([p.primaryCategory!, ...p.additionalCategories].join(', '),
                  style: const TextStyle(color: AppColors.muted, fontSize: 14)),
            ),
          ],
        ],
      ),
    );
  }
}

/// Score + details for the linked business, with loading and blocked states.
class GoogleProfilePanel extends ConsumerWidget {
  const GoogleProfilePanel({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(gbpProfileProvider);
    return async.when(
      loading: () => const Column(children: [CardSkeleton(lines: 3, label: 'Loading your profile'), SizedBox(height: AppSpacing.lg), ListSkeleton(rows: 3, avatar: false)]),
      error: (e, _) => EmptyState(
        icon: Icons.cloud_off_rounded,
        title: "Couldn't load your profile",
        body: e is ProfileException ? e.message : 'Pull down to try again.',
      ),
      data: (v) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ScoreCard(view: v),
          const SizedBox(height: AppSpacing.lg),
          const SectionHeader(title: 'Your profile on Google'),
          const SizedBox(height: AppSpacing.sm),
          ProfileDetails(profile: v.profile),
        ],
      ),
    );
  }
}
