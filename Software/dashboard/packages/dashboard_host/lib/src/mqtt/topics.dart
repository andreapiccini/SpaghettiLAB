class ProtocolV1Topics {
  const ProtocolV1Topics({required this.coreBase, this.clientId = 'dashboard'});

  /// Prefix `<base>/v1/cores/<core_id>` without trailing slash.
  final String coreBase;
  final String clientId;

  static const demo = ProtocolV1Topics(coreBase: 'v1/cores/demo');

  String get requests => '$coreBase/requests/$clientId';
  String get responses => '$coreBase/responses/$clientId';
  String get recordsFilter => '$coreBase/modules/+/records';

  String records(int sourceKey) => '$coreBase/modules/$sourceKey/records';
}
