#!/usr/bin/env python3
"""Verify the public local telemetry and optional managed-sink boundary."""

from __future__ import annotations

import json
from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[2]
MANIFEST = Path(__file__).with_name("manifest.json")
SINK = ROOT / "software/micro-flow-editor/packages/telemetry-buffer/src/sink.ts"
SUBSCRIPTION = ROOT / "software/micro-flow-editor/packages/telemetry-buffer/src/subscription-manager.ts"


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    sink = SINK.read_text(encoding="utf-8")
    subscription = SUBSCRIPTION.read_text(encoding="utf-8")
    match = re.search(r"TELEMETRY_SINK_API_VERSION\s*=\s*(\d+)", sink)
    actual = int(match.group(1)) if match else None
    errors: list[str] = []
    if actual != manifest["sink_api_version"]:
        errors.append(f"sink API={actual}, manifest API={manifest['sink_api_version']}")
    for token in ("onSinkFailure is required", "fanout?.append", "fanout?.recordGap"):
        if token not in subscription:
            errors.append(f"subscription boundary is missing {token}")
    if errors:
        print("Telemetry retention boundary verification failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"Telemetry retention boundary verified: version={manifest['version']} sink_api={actual}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
