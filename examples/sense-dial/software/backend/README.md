# SenseDial Backend

Small HTTP backend for talking to the SenseDial LowSide host interface over USB serial.

It exposes the host-side actions through HTTP so you can use Postman or another client without speaking protobuf + COBS directly.

## What It Exposes

- `POST /api/host/connect`
- `POST /api/host/protocol-info`
- `POST /api/host/request-state`
- `POST /api/host/host-command`
- `POST /api/host/listen-next`
- `GET /api/status`
- `POST /api/disconnect`

The backend keeps one serial session open inside the process and returns decoded protobuf messages as JSON.

## Install

From the repo root:

```bash
python3 -m venv software/backend/.venv
source software/backend/.venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install -r software/backend/requirements.txt
```

If the Python protobuf bindings are not present yet:

```bash
python3 firmware/tools/host_test_tool.py generate-python
```

## Run

From the repo root:

```bash
source software/backend/.venv/bin/activate
uvicorn software.backend.app:app --reload
```

Then open:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## Example Requests

Connect the host link:

```bash
curl -X POST http://127.0.0.1:8000/api/host/connect \
  -H "Content-Type: application/json" \
  -d '{
    "port": "/dev/cu.usbmodem212101",
    "baudrate": 115200,
    "timeout": 0.2,
    "response_timeout": 1.5
  }'
```

Request state:

```bash
curl -X POST http://127.0.0.1:8000/api/host/request-state \
  -H "Content-Type: application/json" \
  -d '{
    "port": "/dev/cu.usbmodem212101",
    "auto_connect": true
  }'
```

Send a host command:

```bash
curl -X POST http://127.0.0.1:8000/api/host/host-command \
  -H "Content-Type: application/json" \
  -d '{
    "port": "/dev/cu.usbmodem212101",
    "auto_connect": true,
    "command": "clear-faults",
    "target": "lowside"
  }'
```

Listen for the next asynchronous message:

```bash
curl -X POST http://127.0.0.1:8000/api/host/listen-next \
  -H "Content-Type: application/json" \
  -d '{
    "port": "/dev/cu.usbmodem212101",
    "response_timeout": 5.0
  }'
```

## Notes

- `connect` and `protocol-info` are the same host-driven handshake operation.
- `request-state` waits for a `ToHost.host_state` response with the same nonce.
- `host-command` currently sends the protobuf frame and returns immediately. It does not force an ACK because the firmware side does not yet guarantee one for every command.
- `listen-next` is useful for debugging asynchronous messages from the LowSide.
