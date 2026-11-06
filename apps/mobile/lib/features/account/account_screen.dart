import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/supabase/supabase_providers.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import '../reports/report_screen.dart';
import '../auth/auth_repository.dart';
import '../business/business_repository.dart';
import 'business_settings_sheet.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  static final _privacyUrl = Uri.parse('https://vistrow.com/privacy-policy');
  static final _termsUrl = Uri.parse('https://vistrow.com/terms');
  static final _supportEmail = Uri.parse('mailto:hello@vistrow.com?subject=RevYne%20help');

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete your account?'),
        content: const Text(
          'This permanently deletes your RevYne account, your business, review page visits and private messages, '
          'and removes RevYne\'s access to your Google profile. This cannot be undone.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete forever'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    try {
      await ref.read(supabaseProvider).functions.invoke('account-delete');
      await ref.read(authRepositoryProvider).signOut();
    } on FunctionException catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not delete your account. Please try again.')));
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(supabaseProvider).auth.currentUser;
    final business = ref.watch(myBusinessProvider).value;
    final name = user?.userMetadata?['full_name'] as String?;

    Widget row(IconData icon, String label, {String? value, VoidCallback? onTap, Color? color}) => InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
            child: Row(
              children: [
                Icon(icon, color: color ?? AppColors.violet, size: 22),
                const SizedBox(width: 14),
                Expanded(child: Text(label, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15.5, color: color ?? AppColors.ink))),
                if (value != null) Text(value, style: const TextStyle(color: AppColors.muted)),
                if (onTap != null) ...[const SizedBox(width: 6), const Icon(Icons.chevron_right_rounded, color: AppColors.outline)],
              ],
            ),
          ),
        );

    Widget group(List<Widget> rows) => AppCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              for (var i = 0; i < rows.length; i++) ...[
                rows[i],
                if (i != rows.length - 1) const Divider(indent: 54),
              ],
            ],
          ),
        );

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, 120),
          children: [
            Text('Account', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: AppSpacing.lg),
            AppCard(
              child: Row(
                children: [
                  InitialsAvatar(name, size: 56),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name ?? 'Your account', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
                        Text(user?.email ?? '', style: const TextStyle(color: AppColors.muted)),
                        const SizedBox(height: 6),
                        const StatusPill(label: 'Free plan', background: AppColors.violet50, foreground: AppColors.violet700),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            const SectionHeader(title: 'Business'),
            const SizedBox(height: AppSpacing.sm),
            group([
              row(Icons.storefront_outlined, business?.name ?? 'Your business', value: business?.city),
              row(
                Icons.tune_rounded,
                'Products, tone & languages',
                onTap: business == null ? null : () => BusinessSettingsSheet.show(context, business),
              ),
              row(
                Icons.description_outlined,
                'Monthly reports',
                onTap: () => Navigator.of(context, rootNavigator: true).push(MaterialPageRoute(builder: (_) => const ReportScreen())),
              ),
            ]),
            const SizedBox(height: AppSpacing.lg),
            const SectionHeader(title: 'Help & legal'),
            const SizedBox(height: AppSpacing.sm),
            group([
              row(Icons.support_agent_rounded, 'Contact support', onTap: () => launchUrl(_supportEmail)),
              row(Icons.privacy_tip_outlined, 'Privacy policy', onTap: () => launchUrl(_privacyUrl, mode: LaunchMode.externalApplication)),
              row(Icons.description_outlined, 'Terms of service', onTap: () => launchUrl(_termsUrl, mode: LaunchMode.externalApplication)),
            ]),
            const SizedBox(height: AppSpacing.lg),
            group([
              row(Icons.logout_rounded, 'Sign out', onTap: () => ref.read(authRepositoryProvider).signOut()),
              row(Icons.delete_outline_rounded, 'Delete account', color: AppColors.danger, onTap: () => _confirmDelete(context, ref)),
            ]),
            const SizedBox(height: AppSpacing.lg),
            const Center(child: BrandMark(size: 22)),
            const SizedBox(height: 6),
            const Center(child: Text('Made by Vistrow Technologies', style: TextStyle(color: AppColors.muted, fontSize: 12.5))),
          ],
        ),
      ),
    );
  }
}
