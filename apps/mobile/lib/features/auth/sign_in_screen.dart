import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/google/google_sign_in_service.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
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
    } on GoogleCancelled {
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
      (Icons.qr_code_2_rounded, 'More genuine Google reviews from a QR code and WhatsApp'),
      (Icons.auto_awesome_rounded, 'AI reply drafts in Hindi, Hinglish or English'),
      (Icons.verified_user_outlined, 'Nothing is posted to Google without your approval'),
    ];

    // On wide screens (browser), show the phone layout as a centred card on the
    // brand gradient instead of stretching it edge to edge.
    final wide = MediaQuery.sizeOf(context).width >= 700;
    Widget page(Widget child) => !wide
        ? Scaffold(backgroundColor: Colors.white, body: child)
        : Scaffold(
            body: Container(
              decoration: BoxDecoration(gradient: AppColors.brandGradient),
              alignment: Alignment.center,
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440, maxHeight: 760),
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: const [BoxShadow(color: Color(0x44120731), blurRadius: 40, offset: Offset(0, 20))],
                  ),
                  child: ClipRRect(borderRadius: BorderRadius.circular(28), child: ColoredBox(color: Colors.white, child: child)),
                ),
              ),
            ),
          );

    return page(Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            flex: 11,
            child: Container(
              decoration: BoxDecoration(gradient: AppColors.brandGradient),
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.xl),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(26),
                          boxShadow: const [BoxShadow(color: Color(0x55120731), blurRadius: 30, offset: Offset(0, 14))],
                          border: Border.all(color: Colors.white.withValues(alpha: 0.6), width: 2),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(24),
                          child: Image.asset('assets/brand/logo.png', width: 84, height: 84),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      const Text(
                        'Grow your business\non Google',
                        style: TextStyle(color: Colors.white, fontSize: 34, fontWeight: FontWeight.w800, height: 1.12, letterSpacing: -0.6),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        'More reviews, faster replies, a stronger profile.',
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 16.5),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            flex: 10,
            child: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    for (final (icon, text) in points)
                      Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.md),
                        child: Row(
                          children: [
                            IconTile(icon, size: 40),
                            const SizedBox(width: AppSpacing.gutter),
                            Expanded(child: Text(text, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600))),
                          ],
                        ),
                      ),
                    const Spacer(),
                    GradientButton(label: 'Continue with Google', icon: Icons.login_rounded, busy: _busy, onPressed: _signIn),
                    const SizedBox(height: AppSpacing.gutter),
                    const Text(
                      'Free to start. No sales calls, ever.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, color: AppColors.muted, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
