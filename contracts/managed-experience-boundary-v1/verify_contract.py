#!/usr/bin/env python3
"""Verify that managed services remain optional overlays."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
manifest = json.loads(Path(__file__).with_name("manifest.json").read_text(encoding="utf-8"))
if manifest.get("version") != 1:
    raise SystemExit("unexpected managed-experience contract version")

rules = manifest["rules"]
for key in ("community_node_red_requires_managed_controller", "community_dashboard_requires_brand_service"):
    if rules[key]:
        raise SystemExit(f"managed service became mandatory: {key}")
if rules["backup_payloads_may_be_committed"] or rules["customer_assets_may_be_committed"]:
    raise SystemExit("runtime/customer data must not be committed")

compose = (ROOT / "software/node-red/compose.yaml").read_text(encoding="utf-8")
for token in ("nodered/node-red:", "127.0.0.1", "node-red-data"):
    if token not in compose:
        raise SystemExit(f"local Node-RED compose lost required token: {token}")

appearance = (ROOT / "software/dashboard/packages/dashboard_domain/lib/src/appearance.dart").read_text(encoding="utf-8")
visual_pack = (ROOT / "software/dashboard/packages/dashboard_domain/lib/src/visual_pack.dart").read_text(encoding="utf-8")
for token, source in (("DashboardAppearance", appearance), ("VisualPack", visual_pack), ("PackSource", visual_pack)):
    if token not in source:
        raise SystemExit(f"public Dashboard surface missing: {token}")

print("Managed experience boundary verified: version=1 local_fallbacks=2")
