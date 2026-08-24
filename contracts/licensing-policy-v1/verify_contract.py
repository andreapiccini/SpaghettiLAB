#!/usr/bin/env python3
"""Verify the declared Community licence and contribution policy."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
manifest = json.loads(Path(__file__).with_name("manifest.json").read_text(encoding="utf-8"))
if manifest.get("version") != 1:
    raise SystemExit("unexpected licensing policy version")
if manifest.get("status") != "superseded" or manifest.get("supersededBy") != "../licensing-policy-v2/manifest.json":
    raise SystemExit("historical licensing policy must point to V2")
if "Developer's Certificate of Origin 1.1" not in (ROOT / "DCO").read_text(encoding="utf-8"):
    raise SystemExit("DCO 1.1 text is missing")
if not (ROOT / ".github/workflows/dco.yml").is_file() or not (ROOT / "scripts/verify-dco.py").is_file():
    raise SystemExit("DCO pull-request enforcement is missing")
if manifest["rules"]["commercial_use_is_prohibited"]:
    raise SystemExit("open Community licences cannot be described as non-commercial")
if manifest["contributions"]["automatic_proprietary_relicensing_right"]:
    raise SystemExit("DCO does not automatically grant proprietary relicensing rights")
print("Licensing policy verified: version=1 status=superseded successor=v2")
