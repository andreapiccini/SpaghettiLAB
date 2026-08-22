import 'package:flutter/material.dart';

import '../theme/spaghetti_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.onSubmit});

  final Future<void> Function(String email, String password) onSubmit;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController(text: FakeHostHint.adminEmail);
  final _password = TextEditingController();
  var _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _email.text.trim();
    final password = _password.text;
    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Inserisci email e password.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.onSubmit(email, password);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = 'Accesso non consentito';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: ListView(
            padding: const EdgeInsets.all(TokenSpace.lg),
            children: [
              const SizedBox(height: TokenSpace.xl),
              Semantics(
                label: 'SpaghettiLAB',
                child: Image.asset(
                  'assets/logo.png',
                  height: 88,
                  fit: BoxFit.contain,
                  filterQuality: FilterQuality.high,
                ),
              ),
              const SizedBox(height: TokenSpace.lg),
              Text('Accedi', style: theme.textTheme.headlineMedium),
              const SizedBox(height: TokenSpace.sm),
              Text(
                'Stessa dashboard, permessi dal ruolo della sessione.',
                style: theme.textTheme.bodySmall,
              ),
              const SizedBox(height: TokenSpace.lg),
              TextField(
                key: const ValueKey('login-email'),
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.username],
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: TokenSpace.sm),
              TextField(
                key: const ValueKey('login-password'),
                controller: _password,
                obscureText: true,
                autofillHints: const [AutofillHints.password],
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _busy ? null : _submit(),
                decoration: const InputDecoration(labelText: 'Password'),
              ),
              if (_error != null) ...[
                const SizedBox(height: TokenSpace.sm),
                Text(_error!, style: const TextStyle(color: TokenColors.error, fontSize: 12)),
              ],
              const SizedBox(height: TokenSpace.lg),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  key: const ValueKey('login-submit'),
                  onPressed: _busy ? null : () => _submit(),
                  child: Text(_busy ? 'Accesso…' : 'Accedi'),
                ),
              ),
              const SizedBox(height: TokenSpace.lg),
              Text(
                FakeHostHint.accounts,
                style: theme.textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Copy only — credentials live on FakeHost.
abstract final class FakeHostHint {
  static const adminEmail = 'admin@demo.local';
  static const accounts =
      'Demo: viewer@demo.local / viewer · operator@demo.local / operator · admin@demo.local / admin · partner@demo.local / partner · support@demo.local / support';
}
