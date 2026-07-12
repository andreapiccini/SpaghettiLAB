#include "app_handlers.h"
#include "link_layer.h"
#include "shared_memory.h"
#include "proto_pack.h"
#include "sensedial_proto_identity.h"
#include <cstring>

// ── Host Handlers ────────────────────────────────────────────────────────

void handle_host_request_state(const SenseDial_LowSide_FromHost &msg)
{
    const auto snap = shared::read(unpack(from_shared::snapshot));
    char motor_diagnostic[220];
    snprintf(motor_diagnostic,
             sizeof(motor_diagnostic),
             "motor c1=%u sensor=%u driver=%u current=%u calibration=%u foc=%u enabled=%u fault=%u cfg=%lu applied=%lu cycles=%lu i2c=%02X as5600=%02X",
             snap.motor_status.core1_running ? 1u : 0u,
             snap.motor_status.sensor_ready ? 1u : 0u,
             snap.motor_status.driver_ready ? 1u : 0u,
             snap.motor_status.current_sense_ready ? 1u : 0u,
             snap.motor_status.calibration_loaded ? 1u : 0u,
             snap.motor_status.foc_initialized ? 1u : 0u,
             snap.motor_status.control_enabled ? 1u : 0u,
             snap.motor_status.fault_active ? 1u : 0u,
             static_cast<unsigned long>(snap.motor_config.config_nonce),
             static_cast<unsigned long>(snap.motor_status.applied_config_nonce),
             static_cast<unsigned long>(snap.motor_status.control_cycle_count),
             snap.motor_status.i2c_detected_address,
             snap.motor_status.as5600_status);
    send_to_host(pack(to_host::log(motor_diagnostic, msg.nonce)));
    send_to_host(pack(to_host::state(msg, snap)));
}

void handle_host_dial_state_request(const SenseDial_LowSide_FromHost &msg)
{
    const auto snap = shared::read(unpack(from_shared::snapshot));
    send_to_host(pack(to_host::dial_state(msg.nonce, snap)));
}

void handle_host_dial_config(const SenseDial_LowSide_FromHost &msg)
{
    shared::write(pack(to_shared::dial_config(msg.payload.dial_config)));
    send_to_host(pack(to_host::ack(msg.nonce)));
    const auto snap = shared::read(unpack(from_shared::snapshot));
    char detail[120];
    snprintf(detail,
             sizeof(detail),
             "host dial_config rx nonce=%u cfg=%lu valid=%u pos=%ld min=%ld max=%ld",
             msg.nonce,
             static_cast<unsigned long>(snap.motor_config.config_nonce),
             snap.motor_config.valid ? 1u : 0u,
             static_cast<long>(snap.motor_config.position),
             static_cast<long>(snap.motor_config.min_position),
             static_cast<long>(snap.motor_config.max_position));
    send_to_host(pack(to_host::log(detail, msg.nonce)));
}

void handle_host_command(const SenseDial_LowSide_FromHost &msg)
{
    switch (msg.payload.host_command.command) {
        case SenseDial_LowSide_HostCommandType_HOST_COMMAND_CLEAR_FAULTS:
            shared::write(MotorSharedCommand{.type = MotorCommandType::ClearFaults});
            send_to_host(pack(to_host::ack(msg.nonce)));
            break;

        case SenseDial_LowSide_HostCommandType_HOST_COMMAND_REBOOT:
            send_to_host(pack(to_host::ack(msg.nonce)));
            delay(120);
            rp2040.reboot();
            break;

        case SenseDial_LowSide_HostCommandType_HOST_COMMAND_SAVE_CONFIGURATION:
            shared::write(MotorSharedCommand{.type = MotorCommandType::SaveConfiguration});
            send_to_host(pack(to_host::ack(msg.nonce)));
            break;

        case SenseDial_LowSide_HostCommandType_HOST_COMMAND_RESTORE_DEFAULTS:
            shared::write(MotorSharedCommand{.type = MotorCommandType::RestoreDefaults});
            send_to_host(pack(to_host::ack(msg.nonce)));
            break;

        case SenseDial_LowSide_HostCommandType_HOST_COMMAND_ENTER_BOOTLOADER:
            break;

        case SenseDial_LowSide_HostCommandType_HOST_COMMAND_TYPE_UNSPECIFIED:
        default:
            break;
    }
}

void handle_host_firmware_update_start(const SenseDial_LowSide_FromHost &msg)
{
    if (msg.payload.firmware_update_start.target !=
        SenseDial_LowSide_FirmwareTarget_FIRMWARE_TARGET_HIGHSIDE) return;
    SenseDial_LowSide_ToHighSide out = SenseDial_LowSide_ToHighSide_init_zero;
    out.protocol_version = SENSEDIAL_LOWSIDE_PROTO_VERSION;
    out.nonce = msg.nonce;
    out.which_payload = SenseDial_LowSide_ToHighSide_firmware_update_start_tag;
    out.payload.firmware_update_start.image_size = msg.payload.firmware_update_start.image_size;
    out.payload.firmware_update_start.chunk_size = msg.payload.firmware_update_start.chunk_size;
    out.payload.firmware_update_start.expected_crc32 = msg.payload.firmware_update_start.expected_crc32;
    if (send_to_highside(out)) send_to_host(pack(to_host::ack(msg.nonce)));
}

void handle_host_firmware_update_chunk(const SenseDial_LowSide_FromHost &msg)
{
    if (msg.payload.firmware_update_chunk.target !=
        SenseDial_LowSide_FirmwareTarget_FIRMWARE_TARGET_HIGHSIDE) return;
    SenseDial_LowSide_ToHighSide out = SenseDial_LowSide_ToHighSide_init_zero;
    out.protocol_version = SENSEDIAL_LOWSIDE_PROTO_VERSION;
    out.nonce = msg.nonce;
    out.which_payload = SenseDial_LowSide_ToHighSide_firmware_update_chunk_tag;
    out.payload.firmware_update_chunk.offset = msg.payload.firmware_update_chunk.offset;
    out.payload.firmware_update_chunk.data.size =
        msg.payload.firmware_update_chunk.data.size;
    memcpy(out.payload.firmware_update_chunk.data.bytes,
           msg.payload.firmware_update_chunk.data.bytes,
           msg.payload.firmware_update_chunk.data.size);
    if (send_to_highside(out)) send_to_host(pack(to_host::ack(msg.nonce)));
}

void handle_host_firmware_update_finish(const SenseDial_LowSide_FromHost &msg)
{
    if (msg.payload.firmware_update_finish.target !=
        SenseDial_LowSide_FirmwareTarget_FIRMWARE_TARGET_HIGHSIDE) return;
    SenseDial_LowSide_ToHighSide out = SenseDial_LowSide_ToHighSide_init_zero;
    out.protocol_version = SENSEDIAL_LOWSIDE_PROTO_VERSION;
    out.nonce = msg.nonce;
    out.which_payload = SenseDial_LowSide_ToHighSide_firmware_update_finish_tag;
    if (send_to_highside(out)) send_to_host(pack(to_host::ack(msg.nonce)));
}

// ── High-Side Handlers ────────────────────────────────────────────────────

void handle_highside_request_state(const SenseDial_LowSide_FromHighSide &msg)
{
    const auto snap = shared::read(unpack(from_shared::snapshot));
    send_to_highside(pack(to_highside::low_side_status(msg.nonce, snap)));
    send_to_highside(pack(to_highside::dial_state(msg.nonce, snap)));
}

void handle_highside_dial_config(const SenseDial_LowSide_FromHighSide &msg)
{
    shared::write(pack(to_shared::dial_config(msg.payload.dial_config)));
    // Config messages always ack.
    send_to_host(pack(to_host::ack(msg.nonce)));
}

void handle_highside_calibration_command(const SenseDial_LowSide_FromHighSide &msg)
{
    shared::write(pack(to_shared::calibration_command(msg.payload.calibration_command)));
    // Config messages always ack.
    send_to_host(pack(to_host::ack(msg.nonce)));
}

void handle_highside_command(const SenseDial_LowSide_FromHighSide &msg)
{
    switch (msg.payload.high_side_command.command) {
        case SenseDial_LowSide_HighSideCommandType_HIGHSIDE_COMMAND_CLEAR_FAULTS:
            // Runtime motor commands are not handled yet.
            break;

        case SenseDial_LowSide_HighSideCommandType_HIGHSIDE_COMMAND_REBOOT:
            // Runtime motor commands are not handled yet.
            break;

        case SenseDial_LowSide_HighSideCommandType_HIGHSIDE_COMMAND_SAVE_CONFIGURATION:
        case SenseDial_LowSide_HighSideCommandType_HIGHSIDE_COMMAND_LOAD_CONFIGURATION:
            // TODO: add control-plane behavior if needed.
            // Config messages always ack.
            send_to_host(pack(to_host::ack(msg.nonce)));
            break;

        case SenseDial_LowSide_HighSideCommandType_HIGHSIDE_COMMAND_TYPE_UNSPECIFIED:
        default:
            break;
    }
}

void handle_highside_fw_update_start(const SenseDial_LowSide_FromHighSide &msg)
{
    (void)msg;
    // TODO: start OTA from high-side.
}

void handle_highside_fw_update_chunk(const SenseDial_LowSide_FromHighSide &msg)
{
    (void)msg;
    // TODO: handle OTA chunk from high-side.
}

void handle_highside_fw_update_finish(const SenseDial_LowSide_FromHighSide &msg)
{
    (void)msg;
    // TODO: close OTA and validate.
}

// ── Dispatchers ───────────────────────────────────────────────────────────

void handle_host_forward_to_highside(const SenseDial_LowSide_FromHost &msg)
{
    const auto &inner = msg.payload.forward_to_highside.message;
    if (inner.which_payload == SenseDial_LowSide_ToHighSide_request_protocol_info_tag) {
        link_layer_request_forward_protocol_info();
    }
    send_to_highside(inner);
}

void handle_from_host(const SenseDial_LowSide_FromHost &msg)
{
    switch (msg.which_payload) {
        case SenseDial_LowSide_FromHost_request_state_tag:          handle_host_request_state(msg);          break;
        case SenseDial_LowSide_FromHost_dial_state_request_tag:     handle_host_dial_state_request(msg);     break;
        case SenseDial_LowSide_FromHost_host_command_tag:           handle_host_command(msg);                break;
        case SenseDial_LowSide_FromHost_forward_to_highside_tag:    handle_host_forward_to_highside(msg);    break;
        case SenseDial_LowSide_FromHost_firmware_update_start_tag:  handle_host_firmware_update_start(msg);  break;
        case SenseDial_LowSide_FromHost_firmware_update_chunk_tag:  handle_host_firmware_update_chunk(msg);  break;
        case SenseDial_LowSide_FromHost_firmware_update_finish_tag: handle_host_firmware_update_finish(msg); break;
        case SenseDial_LowSide_FromHost_dial_config_tag:            handle_host_dial_config(msg);            break;
        default: break;
    }
}

void handle_from_highside(const SenseDial_LowSide_FromHighSide &msg)
{
    switch (msg.which_payload) {
        case SenseDial_LowSide_FromHighSide_request_state_tag:       handle_highside_request_state(msg);                      break;
        case SenseDial_LowSide_FromHighSide_dial_config_tag:          handle_highside_dial_config(msg);                         break;
        case SenseDial_LowSide_FromHighSide_calibration_command_tag:  handle_highside_calibration_command(msg);                 break;
        case SenseDial_LowSide_FromHighSide_high_side_command_tag:    handle_highside_command(msg);                             break;
        case SenseDial_LowSide_FromHighSide_fw_update_start_tag:      handle_highside_fw_update_start(msg);                    break;
        case SenseDial_LowSide_FromHighSide_fw_update_chunk_tag:      handle_highside_fw_update_chunk(msg);                    break;
        case SenseDial_LowSide_FromHighSide_fw_update_finish_tag:     handle_highside_fw_update_finish(msg);                   break;
        case SenseDial_LowSide_FromHighSide_protocol_info_tag:        send_to_host(pack(to_host::forwarded_to_host(msg.nonce, msg))); break;
        default:                                                       send_to_host(pack(to_host::forwarded_to_host(msg.nonce, msg))); break;
    }
}
