#!/usr/bin/env bash
set -euo pipefail
cd /workspace

echo "== dashboard_domain =="
cd packages/dashboard_domain
dart pub get
dart analyze --fatal-infos
dart test

echo "== dashboard_host =="
cd /workspace/packages/dashboard_host
dart pub get
dart analyze --fatal-infos
dart test

echo "== dashboard_app =="
cd /workspace/app
flutter pub get
flutter analyze --fatal-infos
flutter test
flutter build web
