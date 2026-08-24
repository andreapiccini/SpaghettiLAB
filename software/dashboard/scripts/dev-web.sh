#!/usr/bin/env bash
# web-server has no hot reload without a Dart debug client. Restart flutter when
# Dart sources change so a browser refresh shows the new UI.
set -euo pipefail
cd /workspace/app
flutter pub get

fingerprint() {
  find lib ../packages/dashboard_domain ../packages/dashboard_host -name '*.dart' -print0 | sort -z | xargs -0 stat -c '%Y %n' 2>/dev/null | md5sum
}

run_flutter() {
  flutter run -d web-server --web-hostname=0.0.0.0 --web-port=8080 &
  FLUTTER_PID=$!
}

last=$(fingerprint)
run_flutter

while true; do
  sleep 2
  now=$(fingerprint)
  if [[ "$now" != "$last" ]]; then
    last=$now
    echo "== sources changed, restarting flutter =="
    kill "$FLUTTER_PID" 2>/dev/null || true
    wait "$FLUTTER_PID" 2>/dev/null || true
    run_flutter
  fi
done
