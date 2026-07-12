Import("env")

from pathlib import Path
import subprocess
import hashlib
import sys


PROJECT_DIR = Path(env["PROJECT_DIR"]).resolve()   # .../sense-dial/firmware
ROOT_DIR = PROJECT_DIR.parent                      # .../sense-dial
PROTO_DIR = ROOT_DIR / "proto"
GENERATED_DIR = PROTO_DIR / "generated"
PIOENV = env["PIOENV"]
LIBDEPS_DIR = PROJECT_DIR / ".pio" / "libdeps" / PIOENV

IDENTITY_HEADER = GENERATED_DIR / "sensedial_proto_identity.h"

LOWSIDE_VERSION = 1
NANOPB_GENERATOR_VERSION = "0.4.9.1"

PATCHED_PB_ARDUINO_H = """#pragma once

#include <Arduino.h>

extern "C" {
#include "pb_encode.h"
#include "pb_decode.h"
}

pb_ostream_t as_pb_ostream(Print& p);
pb_istream_t as_pb_istream(Stream& p);
"""

PATCHED_PB_ARDUINO_CPP = """#include "pb_arduino.h"

static bool pb_print_write(pb_ostream_t *stream, const pb_byte_t *buf, size_t count) {
    Print* p = reinterpret_cast<Print*>(stream->state);
    size_t written = p->write(buf, count);
    return written == count;
}

pb_ostream_s as_pb_ostream(Print& p) {
#ifndef PB_NO_ERRMSG
    return {pb_print_write, &p, SIZE_MAX, 0, nullptr};
#else
    return {pb_print_write, &p, SIZE_MAX, 0};
#endif
}

static bool pb_stream_read(pb_istream_t *stream, pb_byte_t *buf, size_t count) {
    Stream* s = reinterpret_cast<Stream*>(stream->state);
    size_t written = s->readBytes(reinterpret_cast<char*>(buf), count);
    return written == count;
}

pb_istream_s as_pb_istream(Stream& s) {
#ifndef PB_NO_ERRMSG
    return {pb_stream_read, &s, SIZE_MAX, nullptr};
#else
    return {pb_stream_read, &s, SIZE_MAX};
#endif
}
"""


def run(cmd):
    print("[PROTO] Running:", " ".join(map(str, cmd)))
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr)

    if result.returncode != 0:
        raise RuntimeError("[PROTO] Command failed")

    return result


def ensure_python_package(pkg, version=None):
    try:
        __import__(pkg)
        if version is None:
            return
        result = subprocess.run(
            [sys.executable, "-m", "pip", "show", pkg],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode == 0:
            for line in result.stdout.splitlines():
                if line.startswith("Version:"):
                    installed = line.split(":", 1)[1].strip()
                    if installed == version:
                        return
                    break
    except ImportError:
        pass

    spec = f"{pkg}=={version}" if version else pkg
    print(f"[PROTO] Installing Python package: {spec}")
    run([sys.executable, "-m", "pip", "install", spec])


def hash_files_u64(paths):
    h = hashlib.sha256()
    for p in paths:
        h.update(p.name.encode("utf-8"))
        h.update(b"\0")
        h.update(p.read_bytes())
        h.update(b"\0")
    return int.from_bytes(h.digest()[:8], "big")


def discover_proto_files():
    proto_files = sorted(path.name for path in PROTO_DIR.glob("*.proto"))
    if not proto_files:
        raise RuntimeError(f"[PROTO] No .proto files found in: {PROTO_DIR}")
    return proto_files


def generate_identity():
    lowside_hash = hash_files_u64([PROTO_DIR / name for name in PROTO_FILES])

    content = f"""#pragma once
#include <stdint.h>

#define SENSEDIAL_LOWSIDE_PROTO_VERSION {LOWSIDE_VERSION}

#define SENSEDIAL_LOWSIDE_PROTO_HASH UINT64_C(0x{lowside_hash:016X})
"""

    IDENTITY_HEADER.write_text(content, encoding="utf-8")
    print(f"[PROTO] Wrote {IDENTITY_HEADER}")


def patch_nanopb_arduino():
    lib_src_dir = LIBDEPS_DIR / "nanopb-arduino" / "src"
    header_path = lib_src_dir / "pb_arduino.h"
    source_path = lib_src_dir / "pb_arduino.cpp"

    if not header_path.exists() or not source_path.exists():
        print(f"[PROTO] nanopb-arduino not found under {lib_src_dir}, skipping patch")
        return

    # Patch the PlatformIO-installed package in place so the fix survives clean builds.
    header_path.write_text(PATCHED_PB_ARDUINO_H, encoding="utf-8")
    source_path.write_text(PATCHED_PB_ARDUINO_CPP, encoding="utf-8")
    print(f"[PROTO] Patched PlatformIO nanopb-arduino for {PIOENV}")


def add_generated_sources_to_build():
    # The generated .pb.c files are compiled via wrapper sources under src/common/.
    # Registering them directly from this pre-script would use the host compiler here,
    # which produces non-linkable objects for the embedded target.
    print(f"[PROTO] Generated nanopb sources are compiled via src/common wrappers")


print("[PROTO] PROJECT_DIR =", PROJECT_DIR)
print("[PROTO] ROOT_DIR    =", ROOT_DIR)
print("[PROTO] PROTO_DIR   =", PROTO_DIR)
print("[PROTO] GENERATED   =", GENERATED_DIR)
print("[PROTO] PIOENV      =", PIOENV)
print("[PROTO] LIBDEPS     =", LIBDEPS_DIR)

GENERATED_DIR.mkdir(parents=True, exist_ok=True)
PROTO_FILES = discover_proto_files()
print("[PROTO] PROTO_FILES =", ", ".join(PROTO_FILES))

patch_nanopb_arduino()

# This is the Python generator package for .proto -> nanopb C files.
# It is separate from the PlatformIO-managed embedded runtime path
# (`nanopb-arduino` plus its transitive `Nanopb` dependency).
ensure_python_package("nanopb", NANOPB_GENERATOR_VERSION)

for proto_name in PROTO_FILES:
    proto_path = PROTO_DIR / proto_name
    if not proto_path.exists():
        raise RuntimeError(f"[PROTO] Missing file: {proto_path}")

    cmd = [
        sys.executable,
        "-m",
        "nanopb.generator.nanopb_generator",
        "-I",
        str(PROTO_DIR),
        "-D",
        str(GENERATED_DIR),
        proto_name,
    ]

    run(cmd)

expected = []
for proto_name in PROTO_FILES:
    stem = Path(proto_name).stem
    expected.append(GENERATED_DIR / f"{stem}.pb.c")
    expected.append(GENERATED_DIR / f"{stem}.pb.h")

for f in expected:
    if not f.exists():
        raise RuntimeError(f"[PROTO] Expected generated file not found: {f}")

generate_identity()
add_generated_sources_to_build()

print("[PROTO] Generation and build registration completed successfully.")
