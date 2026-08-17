class DashboardWidget {
  const DashboardWidget({
    required this.widgetId,
    required this.pointId,
    required this.visualHint,
    this.styleId,
    this.column = 0,
    this.row = 0,
    this.width = 1,
    this.height = 1,
  });

  final String widgetId;
  final String pointId;
  final String visualHint;
  final String? styleId;
  final int column;
  final int row;
  final int width;
  final int height;

  factory DashboardWidget.parse(Map<String, Object?> json) {
    return DashboardWidget(
      widgetId: json['widgetId']! as String,
      pointId: json['pointId']! as String,
      visualHint: json['visualHint'] as String? ?? 'value',
      styleId: json['styleId'] as String?,
      column: json['column'] as int? ?? 0,
      row: json['row'] as int? ?? 0,
      width: json['width'] as int? ?? 1,
      height: json['height'] as int? ?? 1,
    );
  }

  Map<String, Object?> toJson() => {
        'widgetId': widgetId,
        'pointId': pointId,
        'visualHint': visualHint,
        'styleId': styleId,
        'column': column,
        'row': row,
        'width': width,
        'height': height,
      };
}

class DashboardPage {
  const DashboardPage({
    required this.pageId,
    required this.title,
    required this.widgets,
  });

  final String pageId;
  final String title;
  final List<DashboardWidget> widgets;

  factory DashboardPage.parse(Map<String, Object?> json) {
    final widgets = json['widgets'];
    return DashboardPage(
      pageId: json['pageId']! as String,
      title: json['title'] as String? ?? '',
      widgets: widgets is List
          ? [
              for (final w in widgets)
                if (w is Map) DashboardWidget.parse(Map<String, Object?>.from(w)),
            ]
          : const [],
    );
  }

  Map<String, Object?> toJson() => {
        'pageId': pageId,
        'title': title,
        'widgets': [for (final w in widgets) w.toJson()],
      };
}

class DashboardLayout {
  const DashboardLayout({required this.pages});

  final List<DashboardPage> pages;

  factory DashboardLayout.parse(Map<String, Object?> json) {
    final pages = json['pages'];
    return DashboardLayout(
      pages: pages is List
          ? [
              for (final p in pages)
                if (p is Map) DashboardPage.parse(Map<String, Object?>.from(p)),
            ]
          : const [],
    );
  }

  Map<String, Object?> toJson() => {
        'pages': [for (final p in pages) p.toJson()],
      };
}
