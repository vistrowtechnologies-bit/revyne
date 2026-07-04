import 'dart:async';

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'config.dart';
import 'screens/auth_screen.dart';
import 'screens/home_shell.dart';
import 'screens/onboarding_screen.dart';
import 'services/business_service.dart';
import 'services/deep_link_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(
    url: AppConfig.supabaseUrl,
    publishableKey: AppConfig.supabaseAnonKey,
  );
  await DeepLinkService.init();
  runApp(const RevyneApp());
}

class RevyneApp extends StatelessWidget {
  const RevyneApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: AppTheme.selected,
      builder: (context, themeId, _) => MaterialApp(
        title: 'RevYne',
        debugShowCheckedModeBanner: false,
        theme: RevyneTheme.light(themeId),
        home: const AuthGate(),
      ),
    );
  }
}

/// Routes between login → onboarding → home based on the Supabase session
/// and whether a business profile exists (server-side, so it never "forgets"
/// onboarding on a reinstall or new device).
class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  StreamSubscription<AuthState>? _sub;
  Session? _session;
  Business? _business;
  bool _loadingBusiness = false;

  @override
  void initState() {
    super.initState();
    _session = Supabase.instance.client.auth.currentSession;
    if (_session != null) _loadBusiness();
    _sub = Supabase.instance.client.auth.onAuthStateChange.listen((state) {
      final newSession = state.session;
      final sameUser = newSession?.user.id == _session?.user.id;
      _session = newSession;
      if (!sameUser) {
        _business = null;
        if (newSession != null) {
          _loadBusiness();
        } else if (mounted) {
          setState(() {});
        }
      } else if (mounted) {
        setState(() {});
      }
    });
  }

  Future<void> _loadBusiness() async {
    setState(() => _loadingBusiness = true);
    try {
      _business = await BusinessService.loadMyBusiness();
    } catch (_) {
      _business = null;
    }
    if (mounted) setState(() => _loadingBusiness = false);
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_session == null) return const AuthScreen();
    if (_loadingBusiness) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_business == null) {
      return OnboardingScreen(onFinished: (b) => setState(() => _business = b));
    }
    return HomeShell(
      business: _business!,
      onBusinessChanged: (b) => setState(() => _business = b),
    );
  }
}
