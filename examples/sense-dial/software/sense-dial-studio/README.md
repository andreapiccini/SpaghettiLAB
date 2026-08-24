# SenseDial Studio

Electron desktop designer for configuring and presenting the SenseDial haptic knob. The renderer is a React/Vite application; a local Python bridge reuses the existing host serial framing and protobuf implementation.

## Setup

From `software/sense-dial-studio`:

```bash
npm install
python3 -m venv ../../firmware/tools/.venv
../../firmware/tools/.venv/bin/pip install -r backend/requirements.txt
npm run dev
```

If the Python environment lives elsewhere:

```bash
SENSEDIAL_PYTHON=/path/to/python npm run dev
```

## Build

```bash
npm run build
npm start
```

The app remains fully interactive in preview mode without a connected device. Hardware changes are sent only when **Apply to SenseDial** is pressed.

## Architecture

- `electron/main.ts`: desktop lifecycle and Python bridge process.
- `src/`: visual React designer and live dial preview.
- `backend/server.py`: localhost-only JSON API wrapping `tools/host_test_tool.py`.
- protobuf remains the source of truth for all device configuration.
