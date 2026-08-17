import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:dashboard_host/dashboard_host.dart';
import 'package:flutter/widgets.dart';

import 'app.dart';

void main() {
  final host = CompositeHost(demo: FakeHost(requireLogin: true), live: EdgeHost())..start();
  runApp(DashboardApp(host: host));
}
