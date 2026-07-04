import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config.dart';
import '../services/business_service.dart';
import '../widgets/ui.dart';
import 'order_history_screen.dart';
import 'pricing_screen.dart';
import 'support_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key, required this.business, required this.onOpenBusinessTab});

  final Business business;
  final VoidCallback onOpenBusinessTab;

  @override
  Widget build(BuildContext context) {
    final user = Supabase.instance.client.auth.currentUser;
    final name = (user?.userMetadata?['full_name'] ?? user?.email ?? 'Your profile').toString();

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.margin),
        children: [
          const Text('RevYne', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.primaryContainer)),
          const SizedBox(height: 20),
          Center(
            child: Stack(
              children: [
                CircleAvatar(
                  radius: 44,
                  backgroundColor: AppColors.primaryFixed,
                  child: Text(
                    name.isNotEmpty ? name[0].toUpperCase() : 'R',
                    style: const TextStyle(fontSize: 32, color: AppColors.primaryContainer, fontWeight: FontWeight.w700),
                  ),
                ),
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(color: AppColors.primaryContainer, shape: BoxShape.circle),
                    child: const Icon(Icons.edit_rounded, size: 14, color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Center(child: Text(name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800))),
          if (user?.email != null) Center(child: Text(user!.email!, style: TextStyle(color: Colors.grey.shade600, fontSize: 13))),
          if (business.mobile.isNotEmpty)
            Center(child: Text('+91 ${business.mobile}', style: TextStyle(color: Colors.grey.shade600, fontSize: 13))),
          const SizedBox(height: 24),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.palette_outlined, size: 18),
                    SizedBox(width: 8),
                    Text('Change Theme', style: TextStyle(fontWeight: FontWeight.w700)),
                  ],
                ),
                const SizedBox(height: 14),
                ValueListenableBuilder<String>(
                  valueListenable: AppTheme.selected,
                  builder: (context, selectedId, _) => Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      for (final option in appThemeOptions)
                        GestureDetector(
                          onTap: () => AppTheme.selected.value = option.id,
                          child: Column(
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: LinearGradient(colors: [option.seed, option.tertiary], begin: Alignment.topLeft, end: Alignment.bottomRight),
                                  border: selectedId == option.id ? Border.all(color: AppColors.onSurface, width: 2) : null,
                                ),
                                child: selectedId == option.id ? const Icon(Icons.check_rounded, color: Colors.white, size: 18) : null,
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          AppCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _menuItem(context, Icons.storefront_outlined, 'My Business', onTap: onOpenBusinessTab),
                const Divider(height: 1),
                _menuItem(context, Icons.info_outline_rounded, 'About RevYne', onTap: () => _showAbout(context)),
                const Divider(height: 1),
                _menuItem(context, Icons.history_rounded, 'Order History',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OrderHistoryScreen()))),
                const Divider(height: 1),
                _menuItem(context, Icons.payments_outlined, 'Plans & Pricing',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PricingScreen()))),
                const Divider(height: 1),
                _menuItem(context, Icons.help_outline_rounded, 'Help & Support',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SupportScreen()))),
                const Divider(height: 1),
                _menuItem(context, Icons.gavel_rounded, 'Terms & Privacy', onTap: () => _showAbout(context)),
                const Divider(height: 1),
                _menuItem(
                  context,
                  Icons.logout_rounded,
                  'Logout',
                  danger: true,
                  onTap: () => Supabase.instance.client.auth.signOut(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Center(child: Text('RevYne v1.0.0', style: TextStyle(color: AppColors.outline, fontSize: 12))),
        ],
      ),
    );
  }

  Widget _menuItem(BuildContext context, IconData icon, String label, {required VoidCallback onTap, bool danger = false}) {
    final color = danger ? AppColors.error : AppColors.primaryContainer;
    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(color: danger ? AppColors.errorContainer : AppColors.primaryFixed, borderRadius: BorderRadius.circular(10)),
        child: Icon(icon, size: 18, color: color),
      ),
      title: Text(label, style: TextStyle(fontWeight: FontWeight.w600, color: danger ? AppColors.error : AppColors.onSurface)),
      trailing: danger ? null : const Icon(Icons.chevron_right_rounded, color: AppColors.outline),
    );
  }

  void _showAbout(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('About RevYne'),
        content: const Text(
          'RevYne helps businesses collect honest customer feedback, generate review suggestions, and reply professionally with AI.',
        ),
        actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close'))],
      ),
    );
  }
}
