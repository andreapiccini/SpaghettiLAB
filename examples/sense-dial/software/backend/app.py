from __future__ import annotations

from typing import Literal, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .serial_client import BackendError, SenseDialSerialClient


app = FastAPI(
    title="SenseDial Host Backend",
    version="0.1.0",
    description="HTTP API for talking to the SenseDial LowSide host interface over USB serial.",
)

client = SenseDialSerialClient()


class SerialRequest(BaseModel):
    port: str = Field(..., description="Serial port path, for example /dev/cu.usbmodem212101")
    baudrate: int = Field(115200, ge=1)
    timeout: float = Field(0.2, gt=0)
    response_timeout: float = Field(1.5, gt=0)


class ConnectRequest(SerialRequest):
    protocol_version: Optional[int] = None
    protocol_hash: Optional[int] = None
    nonce: Optional[int] = None


class RequestStateRequest(SerialRequest):
    protocol_version: Optional[int] = None
    nonce: Optional[int] = None
    auto_connect: bool = False
    include_highside_status: bool = True
    include_lowside_status: bool = True
    include_fw_update_status: bool = True


class HostCommandRequest(SerialRequest):
    protocol_version: Optional[int] = None
    nonce: Optional[int] = None
    auto_connect: bool = False
    command: Literal["reboot", "enter-bootloader", "clear-faults"]
    target: Literal["unspecified", "highside", "lowside"] = "lowside"


def run_or_http_error(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except BackendError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/status")
def get_status():
    return client.status()


@app.post("/api/host/connect")
def connect_host(request: ConnectRequest):
    return run_or_http_error(
        client.connect,
        port=request.port,
        baudrate=request.baudrate,
        timeout=request.timeout,
        response_timeout=request.response_timeout,
        protocol_version=request.protocol_version,
        protocol_hash=request.protocol_hash,
        nonce=request.nonce,
    )


@app.post("/api/host/protocol-info")
def send_protocol_info(request: ConnectRequest):
    return connect_host(request)


@app.post("/api/host/request-state")
def request_state(request: RequestStateRequest):
    return run_or_http_error(
        client.request_state,
        port=request.port,
        baudrate=request.baudrate,
        timeout=request.timeout,
        response_timeout=request.response_timeout,
        protocol_version=request.protocol_version,
        nonce=request.nonce,
        auto_connect=request.auto_connect,
        include_highside_status=request.include_highside_status,
        include_lowside_status=request.include_lowside_status,
        include_fw_update_status=request.include_fw_update_status,
    )


@app.post("/api/host/host-command")
def host_command(request: HostCommandRequest):
    return run_or_http_error(
        client.host_command,
        port=request.port,
        baudrate=request.baudrate,
        timeout=request.timeout,
        response_timeout=request.response_timeout,
        protocol_version=request.protocol_version,
        nonce=request.nonce,
        auto_connect=request.auto_connect,
        command=request.command,
        target=request.target,
    )


@app.post("/api/host/listen-next")
def listen_next(request: SerialRequest):
    return run_or_http_error(
        client.listen_next,
        port=request.port,
        baudrate=request.baudrate,
        timeout=request.timeout,
        response_timeout=request.response_timeout,
    )


@app.post("/api/disconnect")
def disconnect():
    client.close()
    return {"ok": True, "host_ready": False}
