#!/usr/bin/env python3
"""Verify the copyleft Community licensing matrix and explicit exceptions."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
manifest = json.loads(Path(__file__).with_name("manifest.json").read_text(encoding="utf-8"))
if manifest.get("version") != 2:
    raise SystemExit("unexpected licensing policy version")
if manifest.get("transitionRef") != "clean-history-root":
    raise SystemExit("licensing transition reference is missing")

checks = (
    ("firmware/LICENSE", "GNU GENERAL PUBLIC LICENSE"),
    ("software/LICENSE", "GNU AFFERO GENERAL PUBLIC LICENSE"),
    ("contracts/LICENSE", "Apache License"),
    ("software/micro-flow-editor/packages/protocol-sdk/LICENSE", "Apache License"),
    ("software/dashboard/packages/dashboard_domain/LICENSE", "Apache License"),
    ("hardware/LICENSE", "CERN Open Hardware Licence Version 2 - Strongly Reciprocal"),
    ("docs/LICENSE", "Attribution 4.0 International"),
)
for path, marker in checks:
    if marker not in (ROOT / path).read_text(encoding="utf-8"):
        raise SystemExit(f"licence text mismatch: {path}")

if manifest["rules"]["old_apache_grants_are_retroactively_revoked"]:
    raise SystemExit("old Apache grants cannot be described as revoked")
if manifest["rules"]["third_party_code_is_relicensed"]:
    raise SystemExit("third-party code must retain its own licence")
if not manifest["contributions"]["temporarily_closed_external_code_areas"]:
    raise SystemExit("commercial-overlap contribution boundary is missing")

print("Licensing policy verified: version=2 firmware=GPL software=AGPL exceptions=3")
