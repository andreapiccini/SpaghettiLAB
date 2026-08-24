#!/usr/bin/env python3
"""Require a valid Signed-off-by trailer on every commit in a Git range."""

import re
import subprocess
import sys


if len(sys.argv) != 3:
    raise SystemExit("usage: verify-dco.py <base-commit> <head-commit>")

base, head = sys.argv[1:]
records = subprocess.run(
    ["git", "log", "--format=%H%x00%B%x00", f"{base}..{head}"],
    check=True,
    capture_output=True,
    text=True,
).stdout.split("\x00")

failures = []
for index in range(0, len(records) - 1, 2):
    commit = records[index].strip()
    message = records[index + 1]
    if commit and not re.search(r"(?im)^Signed-off-by:\s+.+\s+<[^<>@\s]+@[^<>\s]+>\s*$", message):
        failures.append(commit)

if failures:
    print("DCO sign-off missing from:", file=sys.stderr)
    for commit in failures:
        print(f"- {commit}", file=sys.stderr)
    raise SystemExit(1)

print(f"DCO verified: commits={(len(records) - 1) // 2}")
