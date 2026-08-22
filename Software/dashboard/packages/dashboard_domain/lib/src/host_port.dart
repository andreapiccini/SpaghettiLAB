import 'appearance.dart';
import 'auth.dart';
import 'capabilities.dart';
import 'card_style.dart';
import 'events.dart';
import 'history.dart';
import 'layout.dart';
import 'point.dart';
import 'scene.dart';
import 'site_users.dart';
import 'system.dart';
import 'view.dart';
import 'visual_pack.dart';

/// Sole contract the Flutter app uses. No rules, no MQTT, no Protocol V1.
abstract class HostPort {
  Future<AuthSession> login({required String email, required String password});
  Future<void> logout();
  Future<AuthSession?> currentSession();
  Future<AuthSession> selectSite(String siteId);
  Future<List<SiteUser>> listSiteUsers(String siteId);
  Future<SiteInvite> inviteSiteUser({required String siteId, required String email, required SiteRole role});
  Future<void> revokeSiteUser({required String siteId, required String userId});
  Future<List<SiteSession>> listSiteSessions(String siteId);
  Future<List<SupportGrant>> listSupportGrants(String siteId);
  Future<SupportGrant> requestSupportGrant(String siteId);
  Future<SupportGrant> approveSupportGrant({required String siteId, required String grantId});
  Future<void> revokeSupportGrant({required String siteId, required String grantId});
  Future<List<LabSystem>> listSystems();
  Future<LabSystem> getSystem(String systemId);
  Future<LabSystem> createSystem({required String name, String address = ''});
  Future<List<ExposurePoint>> getPoints(String systemId);
  Future<List<HistorySample>> getPointHistory(String systemId, String pointId);
  Future<DashboardLayout> getLayout(String systemId);
  Future<void> putLayout(String systemId, DashboardLayout layout);
  Future<DashboardAppearance> getAppearance(String systemId);
  Future<void> putAppearance(String systemId, DashboardAppearance appearance);
  Future<void> applyPack(String systemId, String packId);
  Future<ViewPreset> getView(String systemId);
  Future<void> putView(String systemId, ViewPreset view);
  Future<List<Scene>> listScenes(String systemId);
  Future<Scene> getScene(String systemId, String sceneId);
  Future<void> putScene(String systemId, Scene scene);
  Future<List<VisualPackSummary>> listVisualPacks();
  Future<void> installLocalPack(VisualPack pack);
  Future<void> installStorePack(String packId);
  Future<List<CardStyle>> listCardStyles();
  Future<void> installCardStyle(String styleId);
  Future<void> putCardStyle(CardStyle style);
  Future<SystemCapabilities> getCapabilities(String systemId);
  Future<void> sendCommand(String systemId, String pointId, Object value);
  Stream<HostEvent> watch(String systemId);
}

