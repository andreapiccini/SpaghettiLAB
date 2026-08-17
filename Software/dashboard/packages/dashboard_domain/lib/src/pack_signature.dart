import 'dart:convert';
import 'dart:typed_data';

import 'package:crypto/crypto.dart';
import 'package:ed25519_edwards/ed25519_edwards.dart' as ed;

import 'visual_pack.dart';

/// Demo publisher key. Same seed in every checkout — not a production secret.
const spaghettiLabStoreKeyId = 'spaghetti-lab-dev';

Uint8List spaghettiLabStoreSeed() {
  return Uint8List.fromList(sha256.convert(utf8.encode('SpaghettiLAB-dashboard-store-dev-v1')).bytes);
}

Uint8List packCanonicalBytes(VisualPack pack) {
  return Uint8List.fromList(utf8.encode(jsonEncode(pack.toJson())));
}

class SignedPack {
  const SignedPack({
    required this.pack,
    required this.keyId,
    required this.signature,
  });

  final VisualPack pack;
  final String keyId;
  final String signature;

  factory SignedPack.parse(Map<String, Object?> json) {
    final packRaw = json['pack'];
    return SignedPack(
      pack: VisualPack.parse(packRaw is Map ? Map<String, Object?>.from(packRaw) : json),
      keyId: json['keyId'] as String? ?? spaghettiLabStoreKeyId,
      signature: json['signature']! as String,
    );
  }

  Map<String, Object?> toJson() => {
        'keyId': keyId,
        'signature': signature,
        'pack': pack.toJson(),
      };
}

class PackSigner {
  PackSigner.dev() : this._(ed.newKeyFromSeed(spaghettiLabStoreSeed()));

  PackSigner._(this._private);

  final ed.PrivateKey _private;

  String get keyId => spaghettiLabStoreKeyId;

  SignedPack sign(VisualPack pack) {
    final signature = ed.sign(_private, packCanonicalBytes(pack));
    return SignedPack(
      pack: pack,
      keyId: keyId,
      signature: base64Encode(signature),
    );
  }
}

class PackTrust {
  PackTrust.dev() : this({spaghettiLabStoreKeyId: ed.public(ed.newKeyFromSeed(spaghettiLabStoreSeed()))});

  PackTrust(this._keys);

  final Map<String, ed.PublicKey> _keys;

  bool verify(SignedPack signed) {
    final publicKey = _keys[signed.keyId];
    if (publicKey == null) return false;
    try {
      final signature = base64Decode(signed.signature);
      return ed.verify(publicKey, packCanonicalBytes(signed.pack), signature);
    } on FormatException {
      return false;
    } on ArgumentError {
      return false;
    }
  }
}

class PackSignatureException implements Exception {
  PackSignatureException(this.message);
  final String message;
  @override
  String toString() => 'PackSignatureException($message)';
}
