#include "proto_pack.h"

extern "C" {
#include "sensedial_proto_identity.h"
}

namespace
{

MotorSensorType to_sensor_type(SenseDial_LowSide_MotorSensorType v)
{
    switch (v) {
        case SenseDial_LowSide_MotorSensorType_MOTOR_SENSOR_TYPE_NONE:             return MotorSensorType::None;
        case SenseDial_LowSide_MotorSensorType_MOTOR_SENSOR_TYPE_MAGNETIC_ENCODER: return MotorSensorType::MagneticEncoder;
        case SenseDial_LowSide_MotorSensorType_MOTOR_SENSOR_TYPE_HALL:             return MotorSensorType::Hall;
        default:                                                                    return MotorSensorType::Unspecified;
    }
}

MotorSensorDirection to_sensor_direction(SenseDial_LowSide_MotorSensorDirection v)
{
    switch (v) {
        case SenseDial_LowSide_MotorSensorDirection_MOTOR_SENSOR_DIRECTION_CW:   return MotorSensorDirection::Clockwise;
        case SenseDial_LowSide_MotorSensorDirection_MOTOR_SENSOR_DIRECTION_CCW:  return MotorSensorDirection::CounterClockwise;
        case SenseDial_LowSide_MotorSensorDirection_MOTOR_SENSOR_DIRECTION_AUTO: return MotorSensorDirection::Auto;
        default:                                                                  return MotorSensorDirection::Unspecified;
    }
}

MotorMotionType to_motion_type(SenseDial_LowSide_MotorMotionType v)
{
    switch (v) {
        case SenseDial_LowSide_MotorMotionType_MOTOR_MOTION_TYPE_VELOCITY:            return MotorMotionType::Velocity;
        case SenseDial_LowSide_MotorMotionType_MOTOR_MOTION_TYPE_TORQUE:              return MotorMotionType::Torque;
        case SenseDial_LowSide_MotorMotionType_MOTOR_MOTION_TYPE_POSITION_OPEN_LOOP:  return MotorMotionType::PositionOpenLoop;
        case SenseDial_LowSide_MotorMotionType_MOTOR_MOTION_TYPE_VELOCITY_OPEN_LOOP:  return MotorMotionType::VelocityOpenLoop;
        case SenseDial_LowSide_MotorMotionType_MOTOR_MOTION_TYPE_POSITION:            return MotorMotionType::Position;
        default:                                                                       return MotorMotionType::Unspecified;
    }
}

SenseDial_LowSide_ToHost host_envelope(uint16_t nonce)
{
    SenseDial_LowSide_ToHost msg = SenseDial_LowSide_ToHost_init_zero;
    msg.protocol_version = SENSEDIAL_LOWSIDE_PROTO_VERSION;
    msg.nonce = nonce;
    return msg;
}

SenseDial_LowSide_ToHighSide highside_envelope(uint16_t nonce)
{
    SenseDial_LowSide_ToHighSide msg = SenseDial_LowSide_ToHighSide_init_zero;
    msg.protocol_version = SENSEDIAL_LOWSIDE_PROTO_VERSION;
    msg.nonce = nonce;
    return msg;
}

} // anonymous namespace

// ── to_shared:: ───────────────────────────────────────────────────────────

namespace to_shared {

MotorSharedConfig dial_config(const SenseDial_LowSide_DialConfig &src)
{
    MotorSharedConfig cfg = {};
    cfg.valid = true;
    cfg.config_nonce = src.position_nonce;
    cfg.position = src.position;
    cfg.sub_position_unit = src.sub_position_unit;
    cfg.min_position = src.min_position;
    cfg.max_position = src.max_position;
    cfg.position_width_radians = src.position_width_radians;
    cfg.detent_strength_unit = src.detent_strength_unit;
    cfg.endstop_strength_unit = src.endstop_strength_unit;
    cfg.snap_point = src.snap_point;
    cfg.snap_point_bias = src.snap_point_bias;
    cfg.led_hue = src.led_hue;
    cfg.detent_positions_count = static_cast<uint8_t>(src.detent_positions_count);
    for (pb_size_t i = 0; i < src.detent_positions_count && i < 5; ++i) {
        cfg.detent_positions[i] = src.detent_positions[i];
    }
    cfg.override_detents_count = static_cast<uint8_t>(src.override_detents_count);
    for (pb_size_t i = 0; i < src.override_detents_count && i < 8; ++i) {
        cfg.override_detents[i].position = src.override_detents[i].position;
        cfg.override_detents[i].strength = src.override_detents[i].strength;
    }

    cfg.pole_pairs = src.motor_control.pole_pairs;
    cfg.sensor_type = to_sensor_type(src.motor_control.sensor_type);
    cfg.sensor_direction = to_sensor_direction(src.motor_control.sensor_direction);
    cfg.motion_type = to_motion_type(src.motor_control.motion_type);
    cfg.voltage_limit = src.motor_control.voltage_limit;
    cfg.velocity_limit = src.motor_control.velocity_limit;
    cfg.current_limit = src.motor_control.current_limit;
    cfg.velocity_pid.p = src.motor_control.velocity_pid.p;
    cfg.velocity_pid.i = src.motor_control.velocity_pid.i;
    cfg.velocity_pid.d = src.motor_control.velocity_pid.d;
    cfg.velocity_pid.output_ramp = src.motor_control.velocity_pid.output_ramp;
    cfg.velocity_lpf.time_constant = src.motor_control.velocity_lpf.time_constant;
    cfg.current_pid.p = src.motor_control.current_pid.p;
    cfg.current_pid.i = src.motor_control.current_pid.i;
    cfg.current_pid.d = src.motor_control.current_pid.d;
    cfg.current_pid.output_ramp = src.motor_control.current_pid.output_ramp;
    cfg.current_lpf.time_constant = src.motor_control.current_lpf.time_constant;
    cfg.haptic_tuning.detent_gain = src.motor_control.haptic_tuning.detent_gain;
    cfg.haptic_tuning.endstop_gain = src.motor_control.haptic_tuning.endstop_gain;
    cfg.haptic_tuning.deadband_fraction = src.motor_control.haptic_tuning.deadband_fraction;
    cfg.haptic_tuning.torque_filter_time_constant =
        src.motor_control.haptic_tuning.torque_filter_time_constant;
    cfg.haptic_tuning.torque_slew_rate = src.motor_control.haptic_tuning.torque_slew_rate;
    cfg.haptic_tuning.detent_settle_fraction =
        src.motor_control.haptic_tuning.detent_settle_fraction;
    cfg.haptic_tuning.endstop_settle_fraction =
        src.motor_control.haptic_tuning.endstop_settle_fraction;
    cfg.haptic_tuning.idle_release_ms = src.motor_control.haptic_tuning.idle_release_ms;
    return cfg;
}

MotorSharedCommand calibration_command(const SenseDial_LowSide_CalibrationCommand &src)
{
    MotorSharedCommand cmd = {};
    cmd.type = MotorCommandType::StartCalibration;
    cmd.calibration_type = src.type;
    cmd.calibration_channel_id = src.channel_id;
    cmd.persist_calibration_result = src.persist_result;
    return cmd;
}

} // namespace to_shared

// ── to_host:: ─────────────────────────────────────────────────────────────

namespace to_host {

SenseDial_LowSide_ToHost protocol_request(uint16_t nonce)
{
    auto msg = host_envelope(nonce);
    msg.which_payload = SenseDial_LowSide_ToHost_request_protocol_info_tag;
    msg.payload.request_protocol_info = SenseDial_LowSide_RequestProtocolInfo_init_zero;
    return msg;
}

SenseDial_LowSide_ToHost ack(uint16_t nonce)
{
    auto msg = host_envelope(nonce);
    msg.which_payload = SenseDial_LowSide_ToHost_ack_tag;
    msg.payload.ack.nonce = nonce;
    return msg;
}

SenseDial_LowSide_ToHost log(const char *text, uint16_t nonce)
{
    auto msg = host_envelope(nonce);
    msg.which_payload = SenseDial_LowSide_ToHost_log_tag;
    strncpy(msg.payload.log.msg, text, sizeof(msg.payload.log.msg) - 1);
    msg.payload.log.msg[sizeof(msg.payload.log.msg) - 1] = '\0';
    return msg;
}

SenseDial_LowSide_ToHost state(const SenseDial_LowSide_FromHost &req,
                               const LowSideSharedState &snap)
{
    auto msg = host_envelope(req.nonce);
    msg.which_payload = SenseDial_LowSide_ToHost_host_state_tag;

    if (req.payload.request_state.include_highside_status) {
        msg.payload.host_state.has_highside = true;
        msg.payload.host_state.highside.ready = snap.protocol.link_status.highside_ready;
        msg.payload.host_state.highside.bridge_ready = snap.protocol.link_status.highside_ready;
        msg.payload.host_state.highside.connected = snap.protocol.link_status.highside_ready;
        msg.payload.host_state.highside.uptime_ms = snap.protocol.link_status.uptime_ms;
    }
    if (req.payload.request_state.include_lowside_status) {
        msg.payload.host_state.has_lowside = true;
        msg.payload.host_state.lowside.ready = snap.motor_status.foc_initialized;
        msg.payload.host_state.lowside.calibrated = snap.motor_status.calibrated;
        msg.payload.host_state.lowside.fault_active = snap.motor_status.fault_active;
        msg.payload.host_state.lowside.uptime_ms = snap.protocol.link_status.uptime_ms;
        msg.payload.host_state.lowside.protocol_ok = snap.protocol.link_status.host_ready;
        msg.payload.host_state.lowside.applied_config_nonce = snap.motor_status.applied_config_nonce;
    }
    if (req.payload.request_state.include_fw_update_status) {
        msg.payload.host_state.has_firmware = true;
        msg.payload.host_state.firmware.target = SenseDial_LowSide_FirmwareTarget_FIRMWARE_TARGET_LOWSIDE;
        msg.payload.host_state.firmware.phase = snap.protocol.firmware_phase;
        msg.payload.host_state.firmware.received_bytes = snap.protocol.firmware_received_bytes;
        msg.payload.host_state.firmware.expected_bytes = snap.protocol.firmware_expected_bytes;
        strncpy(msg.payload.host_state.firmware.detail,
                snap.protocol.firmware_detail,
                sizeof(msg.payload.host_state.firmware.detail) - 1);
        msg.payload.host_state.firmware.detail[sizeof(msg.payload.host_state.firmware.detail) - 1] = '\0';
    }
    return msg;
}

SenseDial_LowSide_ToHost dial_state(uint16_t nonce, const LowSideSharedState &snap)
{
    auto msg = host_envelope(nonce);
    msg.which_payload = SenseDial_LowSide_ToHost_dial_state_tag;

    msg.payload.dial_state.current_position = snap.motor_status.current_position;
    msg.payload.dial_state.sub_position_unit = snap.motor_status.sub_position_unit;
    msg.payload.dial_state.has_config = true;
    msg.payload.dial_state.config.position = snap.motor_config.position;
    msg.payload.dial_state.config.sub_position_unit = snap.motor_config.sub_position_unit;
    msg.payload.dial_state.config.position_nonce = snap.motor_config.config_nonce;
    msg.payload.dial_state.config.min_position = snap.motor_config.min_position;
    msg.payload.dial_state.config.max_position = snap.motor_config.max_position;
    msg.payload.dial_state.config.position_width_radians = snap.motor_config.position_width_radians;
    msg.payload.dial_state.config.detent_strength_unit = snap.motor_config.detent_strength_unit;
    msg.payload.dial_state.config.endstop_strength_unit = snap.motor_config.endstop_strength_unit;
    msg.payload.dial_state.config.snap_point = snap.motor_config.snap_point;
    msg.payload.dial_state.config.snap_point_bias = snap.motor_config.snap_point_bias;
    msg.payload.dial_state.config.led_hue = snap.motor_config.led_hue;
    msg.payload.dial_state.config.detent_positions_count = snap.motor_config.detent_positions_count;
    for (uint8_t i = 0; i < snap.motor_config.detent_positions_count; ++i) {
        msg.payload.dial_state.config.detent_positions[i] = snap.motor_config.detent_positions[i];
    }
    msg.payload.dial_state.config.override_detents_count = snap.motor_config.override_detents_count;
    for (uint8_t i = 0; i < snap.motor_config.override_detents_count; ++i) {
        msg.payload.dial_state.config.override_detents[i].position =
            snap.motor_config.override_detents[i].position;
        msg.payload.dial_state.config.override_detents[i].strength =
            snap.motor_config.override_detents[i].strength;
    }
    msg.payload.dial_state.config.has_motor_control = true;
    msg.payload.dial_state.config.motor_control.pole_pairs = snap.motor_config.pole_pairs;
    msg.payload.dial_state.config.motor_control.sensor_type =
        static_cast<SenseDial_LowSide_MotorSensorType>(snap.motor_config.sensor_type);
    msg.payload.dial_state.config.motor_control.sensor_direction =
        static_cast<SenseDial_LowSide_MotorSensorDirection>(snap.motor_config.sensor_direction);
    msg.payload.dial_state.config.motor_control.motion_type =
        static_cast<SenseDial_LowSide_MotorMotionType>(snap.motor_config.motion_type);
    msg.payload.dial_state.config.motor_control.voltage_limit = snap.motor_config.voltage_limit;
    msg.payload.dial_state.config.motor_control.velocity_limit = snap.motor_config.velocity_limit;
    msg.payload.dial_state.config.motor_control.current_limit = snap.motor_config.current_limit;
    msg.payload.dial_state.config.motor_control.has_velocity_pid = true;
    msg.payload.dial_state.config.motor_control.velocity_pid.p = snap.motor_config.velocity_pid.p;
    msg.payload.dial_state.config.motor_control.velocity_pid.i = snap.motor_config.velocity_pid.i;
    msg.payload.dial_state.config.motor_control.velocity_pid.d = snap.motor_config.velocity_pid.d;
    msg.payload.dial_state.config.motor_control.velocity_pid.output_ramp =
        snap.motor_config.velocity_pid.output_ramp;
    msg.payload.dial_state.config.motor_control.has_velocity_lpf = true;
    msg.payload.dial_state.config.motor_control.velocity_lpf.time_constant =
        snap.motor_config.velocity_lpf.time_constant;
    msg.payload.dial_state.config.motor_control.has_current_pid = true;
    msg.payload.dial_state.config.motor_control.current_pid.p = snap.motor_config.current_pid.p;
    msg.payload.dial_state.config.motor_control.current_pid.i = snap.motor_config.current_pid.i;
    msg.payload.dial_state.config.motor_control.current_pid.d = snap.motor_config.current_pid.d;
    msg.payload.dial_state.config.motor_control.current_pid.output_ramp =
        snap.motor_config.current_pid.output_ramp;
    msg.payload.dial_state.config.motor_control.has_current_lpf = true;
    msg.payload.dial_state.config.motor_control.current_lpf.time_constant =
        snap.motor_config.current_lpf.time_constant;
    msg.payload.dial_state.config.motor_control.has_haptic_tuning = true;
    msg.payload.dial_state.config.motor_control.haptic_tuning.detent_gain =
        snap.motor_config.haptic_tuning.detent_gain;
    msg.payload.dial_state.config.motor_control.haptic_tuning.endstop_gain =
        snap.motor_config.haptic_tuning.endstop_gain;
    msg.payload.dial_state.config.motor_control.haptic_tuning.deadband_fraction =
        snap.motor_config.haptic_tuning.deadband_fraction;
    msg.payload.dial_state.config.motor_control.haptic_tuning.torque_filter_time_constant =
        snap.motor_config.haptic_tuning.torque_filter_time_constant;
    msg.payload.dial_state.config.motor_control.haptic_tuning.torque_slew_rate =
        snap.motor_config.haptic_tuning.torque_slew_rate;
    msg.payload.dial_state.config.motor_control.haptic_tuning.detent_settle_fraction =
        snap.motor_config.haptic_tuning.detent_settle_fraction;
    msg.payload.dial_state.config.motor_control.haptic_tuning.endstop_settle_fraction =
        snap.motor_config.haptic_tuning.endstop_settle_fraction;
    msg.payload.dial_state.config.motor_control.haptic_tuning.idle_release_ms =
        snap.motor_config.haptic_tuning.idle_release_ms;
    return msg;
}

SenseDial_LowSide_ToHost forwarded_to_host(uint16_t nonce,
                                           const SenseDial_LowSide_FromHighSide &src)
{
    auto msg = host_envelope(nonce);
    msg.which_payload = SenseDial_LowSide_ToHost_forwarded_to_host_tag;
    msg.payload.forwarded_to_host.has_message = true;
    msg.payload.forwarded_to_host.message = src;
    return msg;
}

SenseDial_LowSide_ToHost firmware_update_status(uint16_t nonce, const LowSideSharedState &snap)
{
    auto msg = host_envelope(nonce);
    msg.which_payload = SenseDial_LowSide_ToHost_firmware_update_status_tag;
    msg.payload.firmware_update_status.target = SenseDial_LowSide_FirmwareTarget_FIRMWARE_TARGET_LOWSIDE;
    msg.payload.firmware_update_status.phase = snap.protocol.firmware_phase;
    msg.payload.firmware_update_status.received_bytes = snap.protocol.firmware_received_bytes;
    msg.payload.firmware_update_status.expected_bytes = snap.protocol.firmware_expected_bytes;
    strncpy(msg.payload.firmware_update_status.detail,
            snap.protocol.firmware_detail,
            sizeof(msg.payload.firmware_update_status.detail) - 1);
    msg.payload.firmware_update_status.detail[sizeof(msg.payload.firmware_update_status.detail) - 1] = '\0';
    return msg;
}

} // namespace to_host

// ── to_highside:: ─────────────────────────────────────────────────────────

namespace to_highside {

SenseDial_LowSide_ToHighSide protocol_request(uint16_t nonce)
{
    auto msg = highside_envelope(nonce);
    msg.which_payload = SenseDial_LowSide_ToHighSide_request_protocol_info_tag;
    msg.payload.request_protocol_info = SenseDial_LowSide_RequestProtocolInfo_init_zero;
    return msg;
}

SenseDial_LowSide_ToHighSide ack(uint16_t nonce)
{
    auto msg = highside_envelope(nonce);
    msg.which_payload = SenseDial_LowSide_ToHighSide_ack_tag;
    msg.payload.ack.nonce = nonce;
    return msg;
}

SenseDial_LowSide_ToHighSide log(const char *text, uint16_t nonce)
{
    auto msg = highside_envelope(nonce);
    msg.which_payload = SenseDial_LowSide_ToHighSide_log_tag;
    strncpy(msg.payload.log.msg, text, sizeof(msg.payload.log.msg) - 1);
    msg.payload.log.msg[sizeof(msg.payload.log.msg) - 1] = '\0';
    return msg;
}

SenseDial_LowSide_ToHighSide dial_state(uint16_t nonce, const LowSideSharedState &snap)
{
    auto msg = highside_envelope(nonce);
    msg.which_payload = SenseDial_LowSide_ToHighSide_dial_state_tag;
    msg.payload.dial_state.current_position = snap.motor_status.current_position;
    msg.payload.dial_state.sub_position_unit = snap.motor_status.sub_position_unit;
    msg.payload.dial_state.has_config = true;
    msg.payload.dial_state.config.position = snap.motor_config.position;
    msg.payload.dial_state.config.position_nonce = snap.motor_config.config_nonce;
    msg.payload.dial_state.config.min_position = snap.motor_config.min_position;
    msg.payload.dial_state.config.max_position = snap.motor_config.max_position;
    msg.payload.dial_state.config.position_width_radians =
        snap.motor_config.position_width_radians;
    msg.payload.dial_state.config.detent_strength_unit =
        snap.motor_config.detent_strength_unit;
    msg.payload.dial_state.config.endstop_strength_unit =
        snap.motor_config.endstop_strength_unit;
    msg.payload.dial_state.config.snap_point = snap.motor_config.snap_point;
    msg.payload.dial_state.config.snap_point_bias = snap.motor_config.snap_point_bias;
    msg.payload.dial_state.config.detent_positions_count =
        snap.motor_config.detent_positions_count;
    for (pb_size_t i = 0; i < msg.payload.dial_state.config.detent_positions_count; ++i) {
        msg.payload.dial_state.config.detent_positions[i] =
            snap.motor_config.detent_positions[i];
    }
    msg.payload.dial_state.config.override_detents_count =
        snap.motor_config.override_detents_count;
    for (pb_size_t i = 0; i < msg.payload.dial_state.config.override_detents_count; ++i) {
        msg.payload.dial_state.config.override_detents[i].position =
            snap.motor_config.override_detents[i].position;
        msg.payload.dial_state.config.override_detents[i].strength =
            snap.motor_config.override_detents[i].strength;
    }
    msg.payload.dial_state.config.has_motor_control = true;
    return msg;
}

SenseDial_LowSide_ToHighSide low_side_status(uint16_t nonce, const LowSideSharedState &snap)
{
    auto msg = highside_envelope(nonce);
    msg.which_payload = SenseDial_LowSide_ToHighSide_low_side_status_tag;
    msg.payload.low_side_status.ready = snap.motor_status.foc_initialized;
    msg.payload.low_side_status.calibrated = snap.motor_status.calibrated;
    msg.payload.low_side_status.fault_active = snap.motor_status.fault_active;
    msg.payload.low_side_status.uptime_ms = snap.protocol.link_status.uptime_ms;
    msg.payload.low_side_status.protocol_ok = snap.protocol.link_status.host_ready;
    msg.payload.low_side_status.applied_config_nonce = snap.motor_status.applied_config_nonce;
    return msg;
}

SenseDial_LowSide_ToHighSide fault(uint16_t nonce,
                                   SenseDial_LowSide_FaultCode code,
                                   SenseDial_LowSide_FaultSeverity severity,
                                   bool active,
                                   const char *detail)
{
    auto msg = highside_envelope(nonce);
    msg.which_payload = SenseDial_LowSide_ToHighSide_fault_tag;
    msg.payload.fault.code = code;
    msg.payload.fault.severity = severity;
    msg.payload.fault.active = active;
    strncpy(msg.payload.fault.detail, detail, sizeof(msg.payload.fault.detail) - 1);
    msg.payload.fault.detail[sizeof(msg.payload.fault.detail) - 1] = '\0';
    return msg;
}

SenseDial_LowSide_ToHighSide fw_update_status(uint16_t nonce, const LowSideSharedState &snap)
{
    auto msg = highside_envelope(nonce);
    msg.which_payload = SenseDial_LowSide_ToHighSide_fw_update_status_tag;
    msg.payload.fw_update_status.phase = snap.protocol.firmware_phase;
    msg.payload.fw_update_status.received_bytes = snap.protocol.firmware_received_bytes;
    msg.payload.fw_update_status.expected_bytes = snap.protocol.firmware_expected_bytes;
    strncpy(msg.payload.fw_update_status.detail,
            snap.protocol.firmware_detail,
            sizeof(msg.payload.fw_update_status.detail) - 1);
    msg.payload.fw_update_status.detail[sizeof(msg.payload.fw_update_status.detail) - 1] = '\0';
    return msg;
}

} // namespace to_highside
