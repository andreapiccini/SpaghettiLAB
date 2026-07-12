#pragma once

extern "C" {
#include "sensedial_lowside.pb.h"
}

// ── Host handlers ─────────────────────────────────────────────────────────
// One function per FromHost payload tag. Called after link_layer
// authentication; only application behavior belongs here.

void handle_host_request_state(const SenseDial_LowSide_FromHost &msg);
void handle_host_dial_state_request(const SenseDial_LowSide_FromHost &msg);
void handle_host_forward_to_highside(const SenseDial_LowSide_FromHost &msg);
void handle_host_command(const SenseDial_LowSide_FromHost &msg);
void handle_host_firmware_update_start(const SenseDial_LowSide_FromHost &msg);
void handle_host_firmware_update_chunk(const SenseDial_LowSide_FromHost &msg);
void handle_host_firmware_update_finish(const SenseDial_LowSide_FromHost &msg);

// ── High-side handlers ────────────────────────────────────────────────────
// One function per FromHighSide payload tag.
// Rule: every configuration message must send an ack back to the host.

void handle_highside_request_state(const SenseDial_LowSide_FromHighSide &msg);
void handle_highside_dial_config(const SenseDial_LowSide_FromHighSide &msg);
void handle_highside_calibration_command(const SenseDial_LowSide_FromHighSide &msg);
void handle_highside_command(const SenseDial_LowSide_FromHighSide &msg);
void handle_highside_fw_update_start(const SenseDial_LowSide_FromHighSide &msg);
void handle_highside_fw_update_chunk(const SenseDial_LowSide_FromHighSide &msg);
void handle_highside_fw_update_finish(const SenseDial_LowSide_FromHighSide &msg);

// ── Dispatchers ───────────────────────────────────────────────────────────
// Route an authenticated message to the right handler above.

void handle_from_host(const SenseDial_LowSide_FromHost &msg);
void handle_from_highside(const SenseDial_LowSide_FromHighSide &msg);
