import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _busy = false;

  Future<void> _signInWithGoogle() async {
    setState(() => _busy = true);
    try {
      await Supabase.instance.client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: AppConfig.authRedirect,
        authScreenLaunchMode: LaunchMode.externalApplication,
      );
    } on AuthException catch (e) {
      _showError(e.message);
    } catch (_) {
      _showError('Could not start Google sign-in. Please try again.');
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
    const features = [
      (Icons.star_rounded, Color(0xFFFBBC05), 'Collect Google Reviews'),
      (Icons.reply_rounded, Color(0xFF8127CF), 'AI Reply to Reviews'),
      (Icons.qr_code_2_rounded, Color(0xFF4285F4), 'QR Review Link'),
      (Icons.insights_rounded, Color(0xFF34A853), 'Profile Health Score'),
    ];

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const Spacer(),
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF9B2EFA), RevyneTheme.brandDark],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Icon(Icons.chat_bubble_rounded, color: Colors.white, size: 44),
              ),
              const SizedBox(height: 20),
              Text('RevYne',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              Text("India's AI Review Assistant for Businesses",
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600)),
              const SizedBox(height: 32),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  for (final (icon, color, label) in features)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFEDE9FE)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(icon, size: 18, color: color),
                          const SizedBox(width: 8),
                          Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                        ],
                      ),
                    ),
                ],
              ),
              const Spacer(),
              FilledButton.icon(
                onPressed: _busy ? null : _signInWithGoogle,
                icon: _busy
                    ? const SizedBox(
                        width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.login_rounded),
                label: Text(_busy ? 'Opening Google…' : 'Continue with Google'),
              ),
              const SizedBox(height: 12),
              Text(
                '100% Safe & Secure · Free to start',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
