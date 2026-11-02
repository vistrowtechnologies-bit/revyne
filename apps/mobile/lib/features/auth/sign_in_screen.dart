import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/theme/tokens.dart';
import 'auth_repository.dart';

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  bool _busy = false;

  Future<void> _signIn() async {
    setState(() => _busy = true);
    try {
      await ref.read(authRepositoryProvider).signInWithGoogle();
      // The router redirects once the session arrives.
    } on SignInCancelled {
      // User closed the picker.
    } on AuthException catch (e) {
      _showError(e.message);
    } catch (_) {
      _showError('Could not sign in with Google. Please check your connection and try again.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    const points = [
      (Icons.qr_code_2_rounded, 'Get more genuine Google reviews with a QR code and WhatsApp'),
      (Icons.auto_awesome_rounded, 'Reply to every review in seconds with AI'),
      (Icons.verified_user_rounded, 'Nothing is posted to Google without your approval'),
    ];

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(),
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(16)),
                alignment: Alignment.center,
                child: const Text('R', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800)),
              ),
              const SizedBox(height: AppSpacing.lg),
              Text('Grow your business on Google', style: Theme.of(context).textTheme.displayMedium),
              const SizedBox(height: AppSpacing.sm),
              const Text(
                'More reviews, faster replies, a stronger Google profile.',
                style: TextStyle(fontSize: 16, color: AppColors.onSurfaceVariant),
              ),
              const SizedBox(height: AppSpacing.xl),
              for (final (icon, text) in points)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.md),
                  child: Row(
                    children: [
                      Icon(icon, color: AppColors.primary),
                      const SizedBox(width: AppSpacing.gutter),
                      Expanded(child: Text(text, style: const TextStyle(fontSize: 15))),
                    ],
                  ),
                ),
              const Spacer(),
              FilledButton.icon(
                onPressed: _busy ? null : _signIn,
                icon: _busy
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.login_rounded),
                label: const Text('Continue with Google'),
              ),
              const SizedBox(height: AppSpacing.gutter),
              const Text(
                'Free to start. No sales calls, ever.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
