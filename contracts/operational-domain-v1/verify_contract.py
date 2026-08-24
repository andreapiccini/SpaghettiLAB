#!/usr/bin/env python3
"""Ensure the public project model remains independent of operational tenancy."""

from __future__ import annotations

import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[2]
MANIFEST = Path(__file__).with_name("manifest.json")
PROJECT = ROOT / "software/micro-flow-editor/packages/domain/src/project.ts"


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    project = PROJECT.read_text(encoding="utf-8")
    errors: list[str] = []
    if "expectedDeviceId" not in project or "CoreBinding" not in project:
        errors.append("Community project no longer exposes its local Core/device binding")
    for private_field in ("customerId", "siteId", "fleetId", "managedDeviceId", "tenantId"):
        if private_field in project:
            errors.append(f"Community ProjectV1 unexpectedly requires {private_field}")
    if not manifest["rules"]["community_project_requires_no_operational_assignment"]:
        errors.append("manifest must preserve standalone Community projects")
    if errors:
        print("Operational domain boundary verification failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"Operational domain boundary verified: version={manifest['version']} private_entities={len(manifest['production_entities'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
