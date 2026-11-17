// Sign-in, matching the web app: a brand panel with a short live demo of what
// RevYne does (review arrives → AI drafts → owner approves → posted), then a
// standard Google sign-in button.
import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

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

    final brand = Container(
      decoration: BoxDecoration(gradient: AppColors.brandGradient),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                ClipRRect(borderRadius: BorderRadius.circular(11), child: Image.asset('assets/brand/logo.png', width: 40, height: 40)),
                const SizedBox(width: 10),
                const Text('RevYne', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -0.3)),
              ]),
              const SizedBox(height: AppSpacing.lg),
              const Text(
                'More Google reviews.\nReplies in seconds.',
                style: TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.w800, height: 1.15, letterSpacing: -0.6),
              ),
              const SizedBox(height: 10),
              Text(
                'Collect genuine reviews, reply with AI drafts you approve, and keep your Google profile strong.',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 15.5, height: 1.4),
              ),
              const SizedBox(height: AppSpacing.lg),
              const ReviewDemo(),
            ],
          ),
        ),
      ),
    );

    final panel = SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Sign in to RevYne', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.ink, letterSpacing: -0.4)),
            const SizedBox(height: 6),
            const Text(
              'Use the Google account you want for RevYne. New here? Your account is set up when you first sign in.',
              style: TextStyle(color: AppColors.muted, fontSize: 15),
            ),
            const SizedBox(height: AppSpacing.lg),
            GoogleSignInButton(busy: _busy, onPressed: _signIn),
            const SizedBox(height: 12),
            const Text(
              'Free to start. No sales calls, ever.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.muted, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: AppSpacing.lg),
            const Divider(height: 1),
            const SizedBox(height: AppSpacing.md),
            for (final (icon, text) in points)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(children: [
                  IconTile(icon, size: 34),
                  const SizedBox(width: 12),
                  Expanded(child: Text(text, style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w600))),
                ]),
              ),
            const SizedBox(height: 4),
            Text.rich(
              TextSpan(
                style: const TextStyle(color: AppColors.muted, fontSize: 12.5),
                children: [
                  const TextSpan(text: 'By continuing you agree to the '),
                  _link('Terms', 'https://vistrow.com/terms'),
                  const TextSpan(text: ' and '),
                  _link('Privacy Policy', 'https://vistrow.com/privacy-policy'),
                  const TextSpan(text: '.'),
                ],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );

    // On wide screens (browser), brand on the left and sign-in on the right.
    final wide = MediaQuery.sizeOf(context).width >= 900;
    if (wide) {
      return Scaffold(
        backgroundColor: Colors.white,
        body: Row(
          children: [
            Expanded(flex: 11, child: SingleChildScrollView(child: brand)),
            Expanded(flex: 9, child: Center(child: SingleChildScrollView(child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 440), child: panel)))),
          ],
        ),
      );
    }
    return Scaffold(
      backgroundColor: Colors.white,
      body: SingleChildScrollView(child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [brand, panel])),
    );
  }

  TextSpan _link(String text, String url) => TextSpan(
        text: text,
        style: TextStyle(color: AppColors.violet, fontWeight: FontWeight.w700),
        recognizer: TapGestureRecognizer()..onTap = () => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication),
      );
}

/// Google's standard light sign-in button: white, grey outline, colour G.
class GoogleSignInButton extends StatelessWidget {
  const GoogleSignInButton({super.key, required this.onPressed, this.busy = false});
  final VoidCallback onPressed;
  final bool busy;

  @override
  Widget build(BuildContext context) => SizedBox(
        height: 54,
        child: OutlinedButton(
          onPressed: busy ? null : onPressed,
          style: OutlinedButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: const Color(0xFF1F1F1F),
            disabledForegroundColor: const Color(0xFF1F1F1F),
            side: const BorderSide(color: Color(0xFF747775)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.button)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              busy
                  ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.2, color: AppColors.violet))
                  : const SizedBox(width: 20, height: 20, child: CustomPaint(painter: _GoogleG())),
              const SizedBox(width: 12),
              Text(busy ? 'Opening Google…' : 'Continue with Google', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      );
}

/// The four-colour Google "G".
class _GoogleG extends CustomPainter {
  const _GoogleG();

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width;
    final stroke = s * 0.2;
    final r = (s - stroke) / 2;
    final c = Offset(s / 2, s / 2);
    final rect = Rect.fromCircle(center: c, radius: r);
    Paint p(int color) => Paint()
      ..color = Color(color)
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke;
    double deg(double d) => d * math.pi / 180;
    canvas.drawArc(rect, deg(-40), deg(-95), false, p(0xFFEA4335)); // red, top
    canvas.drawArc(rect, deg(-135), deg(-90), false, p(0xFFFBBC05)); // yellow, left
    canvas.drawArc(rect, deg(135), deg(-90), false, p(0xFF34A853)); // green, bottom
    canvas.drawArc(rect, deg(45), deg(-45), false, p(0xFF4285F4)); // blue, right
    canvas.drawRect(Rect.fromLTWH(s / 2, s / 2 - stroke / 2, r + stroke / 2, stroke), Paint()..color = const Color(0xFF4285F4));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

const _reply = 'Thank you so much, Ananya! So glad the Diwali box made your day — see you again soon.';

/// The product loop in a few seconds. Shows the finished frame when the phone
/// asks for less motion.
class ReviewDemo extends StatefulWidget {
  const ReviewDemo({super.key});

  @override
  State<ReviewDemo> createState() => _ReviewDemoState();
}

class _ReviewDemoState extends State<ReviewDemo> {
  // 0 empty · 1 review in · 2 drafting · 3 typing · 4 posted
  int _phase = 0;
  int _typed = 0;
  Timer? _t;
  bool _still = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final still = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    if (still != _still || _t == null) {
      _still = still;
      _t?.cancel();
      if (still) {
        setState(() {
          _phase = 4;
          _typed = _reply.length;
        });
      } else {
        _next();
      }
    }
  }

  void _after(int ms, VoidCallback f) {
    _t = Timer(Duration(milliseconds: ms), () {
      if (!mounted) return;
      setState(f);
      _next();
    });
  }

  void _next() {
    switch (_phase) {
      case 0:
        _after(500, () => _phase = 1);
      case 1:
        _after(1300, () => _phase = 2);
      case 2:
        _after(1200, () => _phase = 3);
      case 3:
        _typed < _reply.length ? _after(28, () => _typed = math.min(_reply.length, _typed + 2)) : _after(700, () => _phase = 4);
      default:
        _after(3600, () {
          _phase = 0;
          _typed = 0;
        });
    }
  }

  @override
  void dispose() {
    _t?.cancel();
    super.dispose();
  }

  Widget _appear(bool shown, Widget child) => AnimatedSlide(
        offset: shown ? Offset.zero : const Offset(0, 0.12),
        duration: const Duration(milliseconds: 450),
        curve: Curves.easeOutCubic,
        child: AnimatedOpacity(opacity: shown ? 1 : 0, duration: const Duration(milliseconds: 450), child: child),
      );

  @override
  Widget build(BuildContext context) {
    const ink = Color(0xFF1B1530);
    final card = BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), boxShadow: const [BoxShadow(color: Color(0x33120731), blurRadius: 24, offset: Offset(0, 10))]);
    return ExcludeSemantics(
      child: DefaultTextStyle.merge(
        style: const TextStyle(color: ink),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _appear(
              _phase >= 1,
              Container(
                padding: const EdgeInsets.all(14),
                decoration: card,
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    CircleAvatar(radius: 17, backgroundColor: AppColors.violet50, child: Text('AK', style: TextStyle(color: AppColors.violet700, fontWeight: FontWeight.w800, fontSize: 12.5))),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Ananya K.', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                        Text.rich(TextSpan(children: [
                          TextSpan(text: '★★★★★ ', style: TextStyle(color: AppColors.star, fontSize: 13)),
                          TextSpan(text: 'just now', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                        ])),
                      ]),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                      decoration: BoxDecoration(color: AppColors.violet50, borderRadius: BorderRadius.circular(AppRadius.chip)),
                      child: Text('New Google review', style: TextStyle(color: AppColors.violet700, fontWeight: FontWeight.w800, fontSize: 11.5)),
                    ),
                  ]),
                  const SizedBox(height: 8),
                  const Text('Best kaju katli in Pune! The team packed our Diwali gift box beautifully.', style: TextStyle(fontSize: 14, height: 1.4)),
                ]),
              ),
            ),
            const SizedBox(height: 10),
            Padding(
              padding: const EdgeInsets.only(left: 22),
              child: _appear(
                _phase >= 2,
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: card,
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Icon(Icons.auto_awesome_rounded, size: 15, color: AppColors.violet),
                      const SizedBox(width: 4),
                      Text('AI draft', style: TextStyle(color: AppColors.violet, fontWeight: FontWeight.w800, fontSize: 13)),
                      const Spacer(),
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 250),
                        child: _phase == 4
                            ? const Row(key: ValueKey('posted'), children: [
                                Icon(Icons.check_circle_rounded, size: 15, color: AppColors.success),
                                SizedBox(width: 4),
                                Text('Approved & posted', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w800, fontSize: 12.5)),
                              ])
                            : const Text('You approve first', key: ValueKey('wait'), style: TextStyle(color: AppColors.muted, fontWeight: FontWeight.w600, fontSize: 12.5)),
                      ),
                    ]),
                    const SizedBox(height: 8),
                    // The full reply, invisible, keeps the card's height steady while it types.
                    Stack(children: [
                      const Opacity(opacity: 0, child: Text(_reply, style: TextStyle(fontSize: 14, height: 1.4))),
                      if (_phase == 2)
                        const Positioned(left: 0, top: 6, child: _Dots())
                      else
                        Text.rich(
                          TextSpan(children: [
                            TextSpan(text: _reply.substring(0, _typed)),
                            if (_phase == 3) WidgetSpan(child: Container(width: 2, height: 15, color: AppColors.violet)),
                          ]),
                          style: const TextStyle(fontSize: 14, height: 1.4),
                        ),
                    ]),
                  ]),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerLeft,
              child: _appear(
                _phase >= 4,
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(AppRadius.chip)),
                  child: const Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.trending_up_rounded, size: 16, color: Colors.white),
                    SizedBox(width: 6),
                    Text('23 customers went to Google this week', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
                  ]),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Three bouncing dots: "AI is writing".
class _Dots extends StatefulWidget {
  const _Dots();

  @override
  State<_Dots> createState() => _DotsState();
}

class _DotsState extends State<_Dots> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: _c,
        builder: (_, _) => Row(mainAxisSize: MainAxisSize.min, children: [
          for (var i = 0; i < 3; i++)
            Container(
              margin: const EdgeInsets.only(right: 5),
              width: 7,
              height: 7,
              transform: Matrix4.translationValues(0, -4 * math.max(0, math.sin((_c.value - i * 0.15) * 2 * math.pi)), 0),
              decoration: BoxDecoration(color: AppColors.violet, shape: BoxShape.circle),
            ),
        ]),
      );
}
