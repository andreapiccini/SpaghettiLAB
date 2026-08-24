#!/usr/bin/env python3
"""Verify Studio extension API constants and supported surfaces."""

from __future__ import annotations

import json
from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[2]
MANIFEST = Path(__file__).with_name("manifest.json")
REGISTRY = ROOT / "software/micro-flow-editor/packages/app/src/extensions/registry.ts"
VITE = ROOT / "software/micro-flow-editor/packages/app/vite.config.ts"


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    registry = REGISTRY.read_text(encoding="utf-8")
    vite = VITE.read_text(encoding="utf-8")
    match = re.search(r"STUDIO_EXTENSION_API_VERSION\s*=\s*(\d+)", registry)
    actual = int(match.group(1)) if match else None
    errors: list[str] = []
    if actual != manifest["api_version"]:
        errors.append(f"registry API={actual}, manifest API={manifest['api_version']}")
    if manifest["contract"] not in vite:
        errors.append("Vite admission does not reference the canonical contract name")
    for surface in manifest["surfaces"]:
        if f"{surface}()" not in registry:
            errors.append(f"registry is missing surface: {surface}")
    if errors:
        print("Studio extension contract verification failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"Studio extension contract verified: api={actual} surfaces={len(manifest['surfaces'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
