import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/supabase/supabase_providers.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import '../business/business_repository.dart';

/// A saved reply snippet. {name} → reviewer's first name, {business} → business name.
class ReplyTemplate {
  const ReplyTemplate({required this.id, required this.title, required this.body});
  final String id;
  final String title;
  final String body;

  factory ReplyTemplate.fromJson(Map<String, dynamic> j) =>
      ReplyTemplate(id: j['id'] as String, title: j['title'] as String, body: j['body'] as String);
}

/// Fills a template for one review. Without a usable name, "{name}" and the
/// comma or space before it are dropped ("Thanks, {name}!" → "Thanks!").
String fillTemplate(String body, {String? reviewer, required String business}) {
  final first = reviewer?.trim().split(RegExp(r'\s+')).first ?? '';
  final usable = RegExp(r"^[\p{L}][\p{L}\p{M}'.-]{1,30}$", unicode: true).hasMatch(first) && first.toLowerCase() != 'google';
  var out = body.replaceAll('{business}', business);
  out = usable ? out.replaceAll('{name}', first) : out.replaceAll(RegExp(r'[,\s]*\{name\}'), '');
  return out.trim();
}

const starterTemplates = [
  ('Thank you', 'Thank you, {name}! We\'re glad you chose {business} and hope to see you again soon.'),
  ('Sorry it wasn\'t great', 'Thank you for telling us, {name}. We\'re sorry your experience wasn\'t what it should be. Please speak to our team directly so we can put it right.'),
  ('Rating only', 'Thank you for the rating, {name}! It means a lot to everyone at {business}.'),
];

final replyTemplatesProvider = FutureProvider<List<ReplyTemplate>>(retry: (_, _) => null, (ref) async {
  final b = await ref.watch(myBusinessProvider.future);
  if (b == null) return const [];
  final rows = await ref.watch(supabaseProvider).from('reply_templates').select('id,title,body').eq('business_id', b.id).order('created_at');
  return rows.map(ReplyTemplate.fromJson).toList();
});

class TemplateRepository {
  TemplateRepository(this.ref);
  final Ref ref;

  Future<String> _businessId() async => (await ref.read(myBusinessProvider.future))!.id;

  Future<void> save({String? id, required String title, required String body}) async {
    final client = ref.read(supabaseProvider);
    final row = {'title': title.trim(), 'body': body.trim()};
    if (id == null) {
      await client.from('reply_templates').insert({...row, 'business_id': await _businessId()});
    } else {
      await client.from('reply_templates').update(row).eq('id', id);
    }
    ref.invalidate(replyTemplatesProvider);
  }

  Future<void> delete(String id) async {
    await ref.read(supabaseProvider).from('reply_templates').delete().eq('id', id);
    ref.invalidate(replyTemplatesProvider);
  }

  Future<void> addStarters() async {
    final businessId = await _businessId();
    await ref.read(supabaseProvider).from('reply_templates').insert([
      for (final (title, body) in starterTemplates) {'business_id': businessId, 'title': title, 'body': body},
    ]);
    ref.invalidate(replyTemplatesProvider);
  }
}

final templateRepositoryProvider = Provider<TemplateRepository>((ref) => TemplateRepository(ref));

/// Add or edit one template. Pops true when saved.
Future<bool?> showTemplateEditor(BuildContext context, {ReplyTemplate? existing, String? initialBody}) => showModalBottomSheet<bool>(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (_) => _TemplateEditor(existing: existing, initialBody: initialBody),
    );

class _TemplateEditor extends ConsumerStatefulWidget {
  const _TemplateEditor({this.existing, this.initialBody});
  final ReplyTemplate? existing;
  final String? initialBody;

  @override
  ConsumerState<_TemplateEditor> createState() => _TemplateEditorState();
}

class _TemplateEditorState extends ConsumerState<_TemplateEditor> {
  late final _title = TextEditingController(text: widget.existing?.title ?? '');
  late final _body = TextEditingController(text: widget.existing?.body ?? widget.initialBody ?? '');
  bool _saving = false;

  @override
  void dispose() {
    _title.dispose();
    _body.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ref.read(templateRepositoryProvider).save(id: widget.existing?.id, title: _title.text, body: _body.text);
      if (mounted) Navigator.of(context).pop(true);
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not save the template. Please try again.')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(AppSpacing.md, 12, AppSpacing.md, AppSpacing.md),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.line, borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: AppSpacing.md),
              Text(widget.existing == null ? 'New reply template' : 'Edit template', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 4),
              const Text('Use {name} for the reviewer\'s first name and {business} for your business name.',
                  style: TextStyle(color: AppColors.muted, fontSize: 14)),
              const SizedBox(height: AppSpacing.md),
              TextField(controller: _title, maxLength: 60, onChanged: (_) => setState(() {}), decoration: const InputDecoration(hintText: 'Name, e.g. Thank you')),
              TextField(
                controller: _body,
                minLines: 4,
                maxLines: 10,
                maxLength: 1500,
                onChanged: (_) => setState(() {}),
                decoration: const InputDecoration(hintText: 'Thank you, {name}! …'),
              ),
              const SizedBox(height: AppSpacing.sm),
              GradientButton(
                label: 'Save template',
                icon: Icons.bookmark_add_outlined,
                busy: _saving,
                onPressed: _saving || _title.text.trim().isEmpty || _body.text.trim().isEmpty ? null : _save,
              ),
            ]),
          ),
        ),
      );
}

/// Account → Reply templates.
class ReplyTemplatesScreen extends ConsumerWidget {
  const ReplyTemplatesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(replyTemplatesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Reply templates')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showTemplateEditor(context),
        backgroundColor: AppColors.violet,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: const Text('New template'),
      ),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => const Padding(
          padding: EdgeInsets.all(AppSpacing.md),
          child: EmptyState(icon: Icons.cloud_off_rounded, title: "Couldn't load templates", body: 'Please try again.'),
        ),
        data: (items) => ListView(
          padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, 100),
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(4, 0, 4, AppSpacing.md),
              child: Text('Quick replies you can drop into any review reply, then edit before posting.',
                  style: TextStyle(color: AppColors.muted, fontSize: 14)),
            ),
            if (items.isEmpty) ...[
              const EmptyState(icon: Icons.bookmarks_outlined, title: 'No templates yet', body: 'Start with a few ready-made ones, or write your own.'),
              const SizedBox(height: AppSpacing.md),
              OutlinedButton.icon(
                onPressed: () => ref.read(templateRepositoryProvider).addStarters(),
                icon: const Icon(Icons.auto_awesome_outlined),
                label: const Text('Add 3 starter templates'),
              ),
            ],
            for (final t in items)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.gutter),
                child: AppCard(
                  padding: const EdgeInsets.fromLTRB(16, 12, 4, 14),
                  onTap: () => showTemplateEditor(context, existing: t),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Expanded(child: Text(t.title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16))),
                      IconButton(
                        tooltip: 'Delete',
                        onPressed: () async {
                          final ok = await showDialog<bool>(
                                context: context,
                                builder: (c) => AlertDialog(
                                  title: const Text('Delete this template?'),
                                  actions: [
                                    TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
                                    TextButton(
                                      onPressed: () => Navigator.pop(c, true),
                                      style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                                      child: const Text('Delete'),
                                    ),
                                  ],
                                ),
                              ) ??
                              false;
                          if (ok) await ref.read(templateRepositoryProvider).delete(t.id);
                        },
                        icon: const Icon(Icons.delete_outline_rounded, color: AppColors.muted),
                      ),
                    ]),
                    Text(t.body, maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.muted, fontSize: 14.5)),
                  ]),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Template chips for the reply sheet; tapping one fills the reply box.
class TemplateChips extends ConsumerWidget {
  const TemplateChips({super.key, required this.onPick, required this.currentText});
  final void Function(ReplyTemplate t) onPick;
  final String currentText;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(replyTemplatesProvider).value ?? const [];
    return SizedBox(
      height: 40,
      child: ListView(scrollDirection: Axis.horizontal, children: [
        for (final t in items) ...[
          ActionChip(
            avatar: Icon(Icons.bookmark_outline_rounded, size: 16, color: AppColors.violet),
            label: Text(t.title),
            onPressed: () => onPick(t),
          ),
          const SizedBox(width: 6),
        ],
        ActionChip(
          avatar: Icon(currentText.trim().isEmpty ? Icons.add_rounded : Icons.bookmark_add_outlined, size: 16, color: AppColors.violet),
          label: Text(currentText.trim().isEmpty ? 'New template' : 'Save as template'),
          onPressed: () => showTemplateEditor(context, initialBody: currentText.trim().isEmpty ? null : currentText.trim()),
        ),
      ]),
    );
  }
}
