# Host tools

Python helpers that run on the developer machine (not inside Zephyr). Create the
local virtualenv with `make host-tools` — nothing is installed globally.

## Spaghetti CLI V1

`tools/spaghetti.py` speaks Communication Protocol V1. User Config files use
readable JSON; the CLI loads the Core catalog, resolves property names to field
IDs, and exchanges CBOR envelopes. Credentials stay in a `chmod 600` JSON file
(or an interactive prompt) — never on the command line.

```sh
make host-tools

# In-memory fake Core (no hardware)
make spaghetti ARGS='catalog --fake --json'
make spaghetti ARGS='topology --fake'
make spaghetti ARGS='config validate configs/lab.json --fake'
make spaghetti ARGS='config apply configs/lab.json --fake --json'

# Makefile wrappers (CONFIG is a filesystem path, not Kconfig)
make config-validate CONFIG=configs/lab.json
make config-apply CONFIG=configs/lab.json

# Connectivity lease / factory reset (confirmation required)
make spaghetti ARGS='connectivity lease --services wifi --duration 120s --fake'
make spaghetti ARGS='factory-reset --scope config --yes --fake'
```

Machine output uses `--json` (stable key order). `--quiet` returns only the exit
status. Protocol status codes map directly to process exit codes (`conflict` → 4).

Update clients (`update uart|wifi|ble`) verify the signed image locally, stream
bounded chunks with progress, cancel on Ctrl+C, and finalize as **trial** only.
