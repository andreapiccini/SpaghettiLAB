import 'dart:convert';
import 'dart:typed_data';

class ProtocolCodecError implements Exception {
  ProtocolCodecError(this.message);
  final String message;
  @override
  String toString() => 'ProtocolCodecError: $message';
}

const _majorUint = 0;
const _majorNegint = 1;
const _majorBytes = 2;
const _majorText = 3;
const _majorArray = 4;
const _majorMap = 5;
const _majorSimple = 7;

Uint8List _concat(List<Uint8List> chunks) {
  final total = chunks.fold<int>(0, (n, c) => n + c.length);
  final out = Uint8List(total);
  var offset = 0;
  for (final chunk in chunks) {
    out.setRange(offset, offset + chunk.length, chunk);
    offset += chunk.length;
  }
  return out;
}

Uint8List encodeHead(int majorType, int argument) {
  if (argument < 0) throw ProtocolCodecError('CBOR head argument must be non-negative');
  final mt = majorType << 5;
  if (argument < 24) return Uint8List.fromList([mt | argument]);
  if (argument <= 0xff) return Uint8List.fromList([mt | 24, argument]);
  if (argument <= 0xffff) {
    final out = Uint8List(3);
    out[0] = mt | 25;
    ByteData.sublistView(out).setUint16(1, argument, Endian.big);
    return out;
  }
  if (argument <= 0xffffffff) {
    final out = Uint8List(5);
    out[0] = mt | 26;
    ByteData.sublistView(out).setUint32(1, argument, Endian.big);
    return out;
  }
  throw ProtocolCodecError('CBOR argument exceeds 32-bit range used by this host codec');
}

Uint8List encodeUint(int value) => encodeHead(_majorUint, value);

Uint8List encodeInt(int value) =>
    value >= 0 ? encodeHead(_majorUint, value) : encodeHead(_majorNegint, -1 - value);

Uint8List encodeBytes(Uint8List value) => _concat([encodeHead(_majorBytes, value.length), value]);

Uint8List encodeText(String value) {
  final utf8Bytes = Uint8List.fromList(utf8.encode(value));
  return _concat([encodeHead(_majorText, utf8Bytes.length), utf8Bytes]);
}

Uint8List encodeBool(bool value) => Uint8List.fromList([value ? 0xf5 : 0xf4]);

Uint8List encodeFloat64(double value) {
  final out = Uint8List(9);
  out[0] = 0xfb;
  ByteData.sublistView(out).setFloat64(1, value, Endian.big);
  return out;
}

Uint8List encodeMap(List<(int, Uint8List)> pairs) {
  final parts = <Uint8List>[Uint8List.fromList([0xbf])];
  for (final pair in pairs) {
    parts.add(encodeUint(pair.$1));
    parts.add(pair.$2);
  }
  parts.add(Uint8List.fromList([0xff]));
  return _concat(parts);
}

sealed class CborValue {
  const CborValue();
}

class CborUint extends CborValue {
  const CborUint(this.value);
  final int value;
}

class CborInt extends CborValue {
  const CborInt(this.value);
  final int value;
}

class CborBytes extends CborValue {
  const CborBytes(this.value);
  final Uint8List value;
}

class CborText extends CborValue {
  const CborText(this.value);
  final String value;
}

class CborBool extends CborValue {
  const CborBool(this.value);
  final bool value;
}

class CborFloat extends CborValue {
  const CborFloat(this.value);
  final double value;
}

class CborNull extends CborValue {
  const CborNull();
}

class CborMap extends CborValue {
  const CborMap(this.value);
  final Map<int, CborValue> value;
}

class CborArray extends CborValue {
  const CborArray(this.value);
  final List<CborValue> value;
}

class CborReader {
  CborReader(this._bytes);
  final Uint8List _bytes;
  var _offset = 0;

  int get remaining => _bytes.length - _offset;

  int _readByte() {
    if (_offset >= _bytes.length) throw ProtocolCodecError('unexpected end of CBOR input');
    return _bytes[_offset++];
  }

  Uint8List _readBytes(int length) {
    if (_offset + length > _bytes.length) throw ProtocolCodecError('unexpected end of CBOR input');
    final out = Uint8List.sublistView(_bytes, _offset, _offset + length);
    _offset += length;
    return out;
  }

  int _readArgument(int additional) {
    if (additional < 24) return additional;
    if (additional == 24) return _readByte();
    if (additional == 25) {
      final b = _readBytes(2);
      return ByteData.sublistView(b).getUint16(0, Endian.big);
    }
    if (additional == 26) {
      final b = _readBytes(4);
      return ByteData.sublistView(b).getUint32(0, Endian.big);
    }
    throw ProtocolCodecError('unsupported CBOR additional info $additional');
  }

  bool get _atBreak => remaining > 0 && _bytes[_offset] == 0xff;

  CborValue readValue() {
    final head = _readByte();
    final major = head >> 5;
    final additional = head & 0x1f;
    switch (major) {
      case _majorUint:
        return CborUint(_readArgument(additional));
      case _majorNegint:
        return CborInt(-1 - _readArgument(additional));
      case _majorBytes:
        return CborBytes(_readBytes(_readArgument(additional)));
      case _majorText:
        return CborText(utf8.decode(_readBytes(_readArgument(additional))));
      case _majorArray:
        final items = <CborValue>[];
        if (additional == 31) {
          while (!_atBreak) {
            items.add(readValue());
          }
          _readByte();
        } else {
          final length = _readArgument(additional);
          for (var i = 0; i < length; i++) {
            items.add(readValue());
          }
        }
        return CborArray(items);
      case _majorMap:
        final map = <int, CborValue>{};
        void readPair() {
          final key = readValue();
          if (key is! CborUint) throw ProtocolCodecError('CBOR map key must be a non-negative integer');
          if (map.containsKey(key.value)) throw ProtocolCodecError('duplicate CBOR map key ${key.value}');
          map[key.value] = readValue();
        }

        if (additional == 31) {
          while (!_atBreak) {
            readPair();
          }
          _readByte();
        } else {
          final length = _readArgument(additional);
          for (var i = 0; i < length; i++) {
            readPair();
          }
        }
        return CborMap(map);
      case _majorSimple:
        if (additional == 20) return const CborBool(false);
        if (additional == 21) return const CborBool(true);
        if (additional == 22) return const CborNull();
        if (additional == 27) {
          final b = _readBytes(8);
          return CborFloat(ByteData.sublistView(b).getFloat64(0, Endian.big));
        }
        throw ProtocolCodecError('unsupported CBOR simple value $additional');
      default:
        throw ProtocolCodecError('unsupported CBOR major type $major');
    }
  }
}

CborValue decodeOne(Uint8List bytes) => CborReader(bytes).readValue();

int requireUint(Map<int, CborValue> map, int key, String ctx) {
  final value = map[key];
  if (value is! CborUint) throw ProtocolCodecError('$ctx key $key must be a uint');
  return value.value;
}

String requireText(Map<int, CborValue> map, int key, String ctx) {
  final value = map[key];
  if (value is! CborText) throw ProtocolCodecError('$ctx key $key must be text');
  return value.value;
}

Uint8List requireBytes(Map<int, CborValue> map, int key, String ctx) {
  final value = map[key];
  if (value is! CborBytes) throw ProtocolCodecError('$ctx key $key must be bytes');
  return value.value;
}

Object? cborToDart(CborValue value) {
  return switch (value) {
    CborUint(:final value) => value,
    CborInt(:final value) => value,
    CborBool(:final value) => value,
    CborFloat(:final value) => value,
    CborText(:final value) => value,
    CborNull() => null,
    CborBytes(:final value) => value,
    CborMap(:final value) => {for (final e in value.entries) e.key: cborToDart(e.value)},
    CborArray(:final value) => [for (final item in value) cborToDart(item)],
  };
}

Uint8List encodeDart(Object? value) {
  if (value == null) return Uint8List.fromList([0xf6]);
  if (value is bool) return encodeBool(value);
  if (value is int) return encodeInt(value);
  if (value is double) return encodeFloat64(value);
  if (value is String) return encodeText(value);
  throw ProtocolCodecError('unsupported field value ${value.runtimeType}');
}
