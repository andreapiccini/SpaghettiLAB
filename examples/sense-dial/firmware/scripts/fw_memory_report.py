#!/usr/bin/env python3
"""
Report static flash/RAM usage from an RP2040 ELF via arm-none-eabi-size.
Flash used ≈ text + data; RAM static ≈ data + bss (stack/heap not included).

TTY output: colors + Unicode bars. NO_COLOR=1 or --plain -> plain text only.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

# Default Pico (RP2040) values; override via env if needed.
FLASH_TOTAL = int(os.environ.get("FW_MEM_FLASH_BYTES", str(2 * 1024 * 1024)), 10)
RAM_TOTAL = int(os.environ.get("FW_MEM_RAM_BYTES", str(264 * 1024)), 10)

BAR_WIDTH = int(os.environ.get("FW_MEMORY_BAR_WIDTH", "32"), 10)


def find_size_tool() -> str | None:
    prefix = os.environ.get("PICO_TOOLCHAIN_PATH", "").strip()
    if prefix:
        p = Path(prefix) / "bin" / "arm-none-eabi-size"
        if p.is_file() and os.access(p, os.X_OK):
            return str(p)
    return shutil.which("arm-none-eabi-size")


def run_size(elf: Path, size_exe: str) -> tuple[int, int, int]:
    r = subprocess.run(
        [size_exe, "-d", str(elf)],
        capture_output=True,
        text=True,
        check=False,
    )
    out = (r.stdout or "") + (r.stderr or "")
    if r.returncode != 0:
        raise RuntimeError(f"arm-none-eabi-size failed ({r.returncode}):\n{out}")

    lines = [ln.strip() for ln in out.splitlines() if ln.strip()]
    data_line = None
    for ln in reversed(lines):
        if re.match(r"^\d+", ln) and "filename" not in ln.lower():
            data_line = ln
            break
    if not data_line:
        raise RuntimeError(f"Could not parse size output:\n{out}")

    parts = data_line.split()
    if len(parts) < 3:
        raise RuntimeError(f"Unexpected size line: {data_line!r}")
    text, data, bss = int(parts[0]), int(parts[1]), int(parts[2])
    return text, data, bss


def human(n: int) -> str:
    if n >= 1024 * 1024:
        return f"{n / (1024 * 1024):.2f} MiB"
    if n >= 1024:
        return f"{n / 1024:.1f} KiB"
    return f"{n} B"


class Term:
    def __init__(self, use_color: bool) -> None:
        self.use = use_color

    def s(self, *codes: int, text: str = "") -> str:
        if not self.use or not text:
            return text
        return "\033[" + ";".join(str(c) for c in codes) + "m" + text + "\033[0m"

    def bar_segment(self, pct_used: float, width: int, *, unicode_blocks: bool) -> str:
        """Return a [used|free] bar, colorized only when self.use is enabled."""
        ratio = min(1.0, max(0.0, pct_used / 100.0))
        n = int(round(width * ratio))
        full = "█" if unicode_blocks else "#"
        empty_ch = "░" if unicode_blocks else "."
        if not self.use:
            return full * n + empty_ch * (width - n)

        if pct_used >= 90:
            fill_c = (1, 91)
        elif pct_used >= 75:
            fill_c = (1, 33)
        elif pct_used >= 50:
            fill_c = (33,)
        else:
            fill_c = (36,)

        filled = self.s(*fill_c, text=full * n)
        empty = self.s(90, text=empty_ch * (width - n))
        return filled + empty


def should_use_color(plain: bool) -> bool:
    if plain:
        return False
    force_color = os.environ.get("FW_MEMORY_FORCE_COLOR", "").strip().lower()
    if force_color in {"1", "true", "yes", "on"}:
        return True
    if os.environ.get("NO_COLOR", "") != "":
        return False
    if os.environ.get("TERM", "") == "dumb":
        return False
    return sys.stdout.isatty()


def print_graphic_report(
    elf: Path,
    text: int,
    data: int,
    bss: int,
    flash_used: int,
    ram_static: int,
    flash_free: int,
    ram_free: int,
    fp: float,
    rp: float,
    *,
    plain: bool,
) -> None:
    force_color = os.environ.get("FW_MEMORY_FORCE_COLOR", "").strip().lower() in {"1", "true", "yes", "on"}
    tty = sys.stdout.isatty() or force_color
    # In pipes/logs avoid Unicode boxes and ANSI colors.
    fancy = tty and not plain
    use_color = fancy and should_use_color(plain=False)
    c = Term(use_color)
    w = max(16, min(48, BAR_WIDTH))
    line_w = w + 38

    if fancy:
        top = "╭" + "─" * (line_w - 2) + "╮"
        bot = "╰" + "─" * (line_w - 2) + "╯"
        vbar = "│"
    else:
        top = "+" + "-" * (line_w - 2) + "+"
        bot = "+" + "-" * (line_w - 2) + "+"
        vbar = "|"

    title = " Pico RP2040 - Firmware Memory (Static) "
    pad = line_w - 2 - len(title)
    left, right = pad // 2, pad - pad // 2
    if fancy and use_color:
        row = (
            vbar
            + c.s(1, 36, text=" " * left)
            + c.s(1, 96, text=title)
            + c.s(1, 36, text=" " * right)
            + vbar
        )
    else:
        row = f"{vbar}{' ' * left}{title.strip()}{' ' * right}{vbar}"

    print()
    print(c.s(90, text=top) if use_color else top)
    print(c.s(90, text=row) if use_color else row)
    print(c.s(90, text=bot) if use_color else bot)
    print()

    elf_line = f"  ELF  {c.s(1, 97, text=elf.name) if use_color else elf.name}"
    print(elf_line)
    print(
        f"  {c.s(2, text='text') if use_color else 'text'}  {text:>8} B   {human(text):>10}    "
        f"{c.s(2, text='data') if use_color else 'data'}  {data:>6} B   "
        f"{c.s(2, text='bss') if use_color else 'bss'}  {bss:>6} B"
    )
    print()

    flash_bar = c.bar_segment(fp, w, unicode_blocks=fancy)
    ram_bar = c.bar_segment(rp, w, unicode_blocks=fancy)

    lbl_flash = "FLASH" if not use_color else c.s(1, 94, text="FLASH")
    lbl_ram = "RAM  " if not use_color else c.s(1, 95, text="RAM  ")
    pct_f = f"{fp:5.1f}%"
    pct_r = f"{rp:5.1f}%"
    if use_color:
        pct_f = c.s(1, 97, text=pct_f)
        pct_r = c.s(1, 97, text=pct_r)

    print(f"  {lbl_flash}  [{flash_bar}]  {pct_f}  used  {human(flash_used)} / {human(FLASH_TOTAL)}")
    print(f"         {c.s(2, 90, text='free') if use_color else 'free'}  ~{human(flash_free)}")
    print()
    print(f"  {lbl_ram}  [{ram_bar}]  {pct_r}  used  {human(ram_static)} / {human(RAM_TOTAL)}")
    print(f"         {c.s(2, 90, text='free') if use_color else 'free'}  ~{human(ram_free)}")
    print()
    note = (
        "  Note: RAM includes only static .data + .bss; stack/heap are not included. "
        "Default totals are 2 MiB flash / 264 KiB RAM (override with FW_MEM_*_BYTES)."
    )
    print(c.s(2, 90, text=note) if use_color else note)
    print()


def main() -> int:
    ap = argparse.ArgumentParser(description="RP2040 firmware memory report from ELF")
    ap.add_argument("elf", type=Path, help="Path to .elf")
    ap.add_argument(
        "--write-flash-snapshot",
        metavar="ROOT",
        type=Path,
        default=None,
        help="Write JSON snapshot under ROOT for tooling/IDE",
    )
    ap.add_argument("--quiet", action="store_true", help="No stdout (still writes snapshot if requested)")
    ap.add_argument("--plain", action="store_true", help="No color / no Unicode box (pipe-friendly)")
    args = ap.parse_args()

    elf = args.elf.resolve()
    if not elf.is_file():
        print(f"ELF not found: {elf}", file=sys.stderr)
        return 1

    size_exe = find_size_tool()
    if not size_exe:
        print("arm-none-eabi-size not found (set PICO_TOOLCHAIN_PATH or PATH)", file=sys.stderr)
        return 1

    try:
        text, data, bss = run_size(elf, size_exe)
    except RuntimeError as e:
        print(e, file=sys.stderr)
        return 1

    flash_used = text + data
    ram_static = data + bss
    flash_free = max(0, FLASH_TOTAL - flash_used)
    ram_free = max(0, RAM_TOTAL - ram_static)
    fp = 100.0 * flash_used / FLASH_TOTAL if FLASH_TOTAL else 0.0
    rp = 100.0 * ram_static / RAM_TOTAL if RAM_TOTAL else 0.0

    snap = {
        "elf": str(elf),
        "timestamp_unix": int(time.time()),
        "flash_total_bytes": FLASH_TOTAL,
        "flash_used_bytes": flash_used,
        "flash_free_bytes": flash_free,
        "flash_used_percent": round(fp, 2),
        "ram_total_bytes": RAM_TOTAL,
        "ram_static_bytes": ram_static,
        "ram_static_percent": round(rp, 2),
        "size_text": text,
        "size_data": data,
        "size_bss": bss,
    }

    if args.write_flash_snapshot:
        root = args.write_flash_snapshot.resolve()
        root.mkdir(parents=True, exist_ok=True)
        out_path = root / ".fw_memory_snapshot.json"
        out_path.write_text(json.dumps(snap, indent=2) + "\n", encoding="utf-8")
        if not args.quiet:
            msg = f"Snapshot → {out_path}"
            uc = should_use_color(args.plain)
            print(Term(uc).s(2, 32, text=msg) if uc else msg)

    if not args.quiet:
        print_graphic_report(
            elf,
            text,
            data,
            bss,
            flash_used,
            ram_static,
            flash_free,
            ram_free,
            fp,
            rp,
            plain=args.plain,
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
