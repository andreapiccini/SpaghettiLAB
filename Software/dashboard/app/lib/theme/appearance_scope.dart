import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/widgets.dart';

class AppearanceScope extends InheritedWidget {
  const AppearanceScope({super.key, required this.appearance, required super.child});

  final DashboardAppearance appearance;

  static DashboardAppearance of(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<AppearanceScope>()!.appearance;
  }

  @override
  bool updateShouldNotify(AppearanceScope oldWidget) => appearance != oldWidget.appearance;
}

class AppearanceController extends ChangeNotifier {
  AppearanceController(this._host, this._systemId);

  final HostPort _host;
  String _systemId;
  DashboardAppearance _appearance = DashboardAppearance.lightDefaults;

  DashboardAppearance get appearance => _appearance;

  void bind(String systemId) {
    _systemId = systemId;
  }

  Future<void> load() async {
    _appearance = await _host.getAppearance(_systemId);
    notifyListeners();
  }

  Future<void> save(DashboardAppearance next) async {
    await _host.putAppearance(_systemId, next);
    _appearance = next;
    notifyListeners();
  }

  Future<void> applyPack(String packId) async {
    await _host.applyPack(_systemId, packId);
    await load();
  }
}
