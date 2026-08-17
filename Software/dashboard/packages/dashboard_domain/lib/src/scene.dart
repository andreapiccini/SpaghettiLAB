/// 2D scene for schematic / top_down (D200+). Coordinates are 0–100 percent.
class SceneTransform {
  const SceneTransform({
    required this.x,
    required this.y,
    this.z = 0,
    this.rotation = 0,
    this.scale = 1,
  });

  final double x;
  final double y;
  final double z;
  final double rotation;
  final double scale;

  SceneTransform copyWith({double? x, double? y, double? z, double? rotation, double? scale}) {
    return SceneTransform(
      x: x ?? this.x,
      y: y ?? this.y,
      z: z ?? this.z,
      rotation: rotation ?? this.rotation,
      scale: scale ?? this.scale,
    );
  }

  factory SceneTransform.parse(Map<String, Object?> json) {
    return SceneTransform(
      x: (json['x'] as num?)?.toDouble() ?? 0,
      y: (json['y'] as num?)?.toDouble() ?? 0,
      z: (json['z'] as num?)?.toDouble() ?? 0,
      rotation: (json['rotation'] as num?)?.toDouble() ?? 0,
      scale: (json['scale'] as num?)?.toDouble() ?? 1,
    );
  }

  Map<String, Object?> toJson() => {
        'x': x,
        'y': y,
        'z': z,
        'rotation': rotation,
        'scale': scale,
      };
}

class SceneNode {
  const SceneNode({
    required this.nodeId,
    required this.transform,
    this.pointId,
    this.label,
    this.assetRef = 'marker',
    this.kind = 'asset',
  });

  final String nodeId;
  final String? pointId;
  final String? label;
  final String assetRef;
  final String kind;
  final SceneTransform transform;

  SceneNode copyWith({
    String? pointId,
    String? label,
    String? assetRef,
    SceneTransform? transform,
  }) {
    return SceneNode(
      nodeId: nodeId,
      pointId: pointId ?? this.pointId,
      label: label ?? this.label,
      assetRef: assetRef ?? this.assetRef,
      kind: kind,
      transform: transform ?? this.transform,
    );
  }

  factory SceneNode.parse(Map<String, Object?> json) {
    final raw = json['transform'];
    return SceneNode(
      nodeId: json['nodeId']! as String,
      pointId: json['pointId'] as String?,
      label: json['label'] as String?,
      assetRef: json['assetRef'] as String? ?? 'marker',
      kind: json['kind'] as String? ?? 'asset',
      transform: raw is Map
          ? SceneTransform.parse(Map<String, Object?>.from(raw))
          : SceneTransform(
              x: (json['x'] as num?)?.toDouble() ?? 0,
              y: (json['y'] as num?)?.toDouble() ?? 0,
              z: (json['z'] as num?)?.toDouble() ?? 0,
            ),
    );
  }

  Map<String, Object?> toJson() => {
        'nodeId': nodeId,
        'pointId': pointId,
        'label': label,
        'assetRef': assetRef,
        'kind': kind,
        'transform': transform.toJson(),
      };
}

class SceneEdge {
  const SceneEdge({
    required this.from,
    required this.to,
    this.shape = SceneEdgeShape.auto,
  });

  final String from;
  final String to;
  final SceneEdgeShape shape;

  factory SceneEdge.parse(Map<String, Object?> json) {
    final raw = json['shape'] as String?;
    var shape = SceneEdgeShape.auto;
    if (raw != null) {
      for (final value in SceneEdgeShape.values) {
        if (value.name == raw) {
          shape = value;
          break;
        }
      }
    }
    return SceneEdge(from: json['from']! as String, to: json['to']! as String, shape: shape);
  }

  Map<String, Object?> toJson() => {
        'from': from,
        'to': to,
        if (shape != SceneEdgeShape.auto) 'shape': shape.name,
      };
}

enum SceneEdgeShape { auto, horizontal, vertical, rounded }

class SceneCamera {
  const SceneCamera({
    required this.cameraId,
    this.x = 50,
    this.z = 0,
    this.yaw = 0,
  });

  final String cameraId;
  final double x;
  final double z;
  final double yaw;

  factory SceneCamera.parse(Map<String, Object?> json) {
    return SceneCamera(
      cameraId: json['cameraId'] as String? ?? 'default',
      x: (json['x'] as num?)?.toDouble() ?? 50,
      z: (json['z'] as num?)?.toDouble() ?? 0,
      yaw: (json['yaw'] as num?)?.toDouble() ?? 0,
    );
  }

  Map<String, Object?> toJson() => {'cameraId': cameraId, 'x': x, 'z': z, 'yaw': yaw};
}

class Scene {
  const Scene({
    required this.sceneId,
    required this.name,
    required this.nodes,
    this.edges = const [],
    this.cameras = const [],
    this.kindHint = 'top_down',
  });

  final String sceneId;
  final String name;
  final String kindHint;
  final List<SceneNode> nodes;
  final List<SceneEdge> edges;
  final List<SceneCamera> cameras;

  Scene copyWith({
    List<SceneNode>? nodes,
    List<SceneEdge>? edges,
    List<SceneCamera>? cameras,
    String? name,
  }) {
    return Scene(
      sceneId: sceneId,
      name: name ?? this.name,
      kindHint: kindHint,
      nodes: nodes ?? this.nodes,
      edges: edges ?? this.edges,
      cameras: cameras ?? this.cameras,
    );
  }

  factory Scene.parse(Map<String, Object?> json) {
    final nodesRaw = json['nodes'];
    final edgesRaw = json['edges'];
    final camerasRaw = json['cameras'];
    return Scene(
      sceneId: json['sceneId']! as String,
      name: json['name'] as String? ?? json['sceneId']! as String,
      kindHint: json['kindHint'] as String? ?? 'top_down',
      nodes: nodesRaw is List
          ? [
              for (final n in nodesRaw)
                if (n is Map) SceneNode.parse(Map<String, Object?>.from(n)),
            ]
          : const [],
      edges: edgesRaw is List
          ? [
              for (final e in edgesRaw)
                if (e is Map) SceneEdge.parse(Map<String, Object?>.from(e)),
            ]
          : const [],
      cameras: camerasRaw is List
          ? [
              for (final c in camerasRaw)
                if (c is Map) SceneCamera.parse(Map<String, Object?>.from(c)),
            ]
          : const [],
    );
  }

  Map<String, Object?> toJson() => {
        'sceneId': sceneId,
        'name': name,
        'kindHint': kindHint,
        'nodes': [for (final n in nodes) n.toJson()],
        'edges': [for (final e in edges) e.toJson()],
        'cameras': [for (final c in cameras) c.toJson()],
      };
}
