# SenseDial

Dual-processor haptic dial example:

- RP2350 low-side for SimpleFOC motor control and host communication
- ESP32-S3 high-side for the Waveshare 1.43-inch round AMOLED interface
- protobuf protocol shared by the desktop app and both processors
- Electron SenseDial Studio for live configuration and telemetry

See [firmware/README.md](firmware/README.md) for architecture, wiring, build,
flash and bridged high-side OTA instructions.
