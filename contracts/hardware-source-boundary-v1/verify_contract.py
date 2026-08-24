#!/usr/bin/env python3
"""Static clean-clone checks for the public KiCad source boundary."""

import json
from pathlib import Path
import subprocess


ROOT = Path(__file__).resolve().parents[2]
manifest = json.loads(Path(__file__).with_name("manifest.json").read_text(encoding="utf-8"))
if manifest.get("version") != 1:
    raise SystemExit("unexpected hardware-source boundary version")

for project in manifest["public_projects"]:
    stem = ROOT / project["path"]
    pro = stem.with_suffix(".kicad_pro")
    sch = stem.with_suffix(".kicad_sch")
    pcb = stem.with_suffix(".kicad_pcb")
    for source in (pro, sch, pcb):
        if not source.is_file():
            raise SystemExit(f"missing public KiCad source: {source.relative_to(ROOT)}")
    json.loads(pro.read_text(encoding="utf-8"))
    schematic = sch.read_text(encoding="utf-8")
    board = pcb.read_text(encoding="utf-8")
    if "(lib_symbols" not in schematic:
        raise SystemExit(f"schematic has no embedded symbol library: {sch.relative_to(ROOT)}")
    if "(footprint " not in board:
        raise SystemExit(f"board has no embedded placed footprints: {pcb.relative_to(ROOT)}")

tracked = subprocess.run(
    ["git", "ls-files", "hardware"], cwd=ROOT, check=True, capture_output=True, text=True
).stdout.replace("\\", "/").splitlines()
for path in tracked:
    lowered = path.lower()
    path_parts = Path(lowered).parts
    if "production" in path_parts or lowered.endswith((".zip", ".csv", ".ipc")) or lowered.endswith("fabrication-toolkit-options.json"):
        raise SystemExit(f"generated manufacturing artifact is tracked: {path}")

print(f"Hardware source boundary verified: version=1 projects={len(manifest['public_projects'])}")
