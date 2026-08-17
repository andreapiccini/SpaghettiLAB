import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/widgets.dart';

class HostScope extends InheritedWidget {
  const HostScope({super.key, required this.host, required this.systemId, required super.child});

  final HostPort host;
  final String systemId;

  static HostScope of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<HostScope>();
    assert(scope != null, 'HostScope missing');
    return scope!;
  }

  @override
  bool updateShouldNotify(HostScope oldWidget) =>
      host != oldWidget.host || systemId != oldWidget.systemId;
}
