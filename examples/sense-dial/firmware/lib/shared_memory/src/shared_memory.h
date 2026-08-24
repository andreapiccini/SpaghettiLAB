#pragma once

#include <Arduino.h>

extern "C" {
#include "sensedial_lowside.pb.h"
}

enum class MotorCommandType : uint8_t
{
    None = 0,
    ApplyConfig,
    ClearFaults,
    Reboot,
    SaveConfiguration,
    RestoreDefaults,
    StartCalibration,
};

enum class MotorSensorType : uint8_t
{
    Unspecified = 0,
    None,
    MagneticEncoder,
    Hall,
};

enum class MotorSensorDirection : uint8_t
{
    Unspecified = 0,
    Auto,
    Clockwise,
    CounterClockwise,
};

enum class MotorMotionType : uint8_t
{
    Unspecified = 0,
    Position,
    Velocity,
    Torque,
    PositionOpenLoop,
    VelocityOpenLoop,
};

struct MotorPidConfig
{
    float p = 0.5f;
    float i = 10.0f;
    float d = 0.0f;
    float output_ramp = 1000.0f;
};

struct MotorLowPassConfig
{
    float time_constant = 0.01f;
};

struct MotorHapticTuningConfig
{
    float detent_gain = 0.42f;
    float endstop_gain = 0.65f;
    float deadband_fraction = 0.035f;
    float torque_filter_time_constant = 0.012f;
    float torque_slew_rate = 55.0f;
    float detent_settle_fraction = 0.035f;
    float endstop_settle_fraction = 0.035f;
    float idle_release_ms = 180.0f;
    float idle_centering_delay_ms = 500.0f;
};

struct MotorOverrideDetent
{
    int32_t position = 0;
    float strength = 0.0f;
};

struct LinkSharedStatus
{
    bool host_ready = false;
    bool highside_ready = false;
    uint32_t uptime_ms = 0;
};

struct ProtocolSharedState
{
    
    LinkSharedStatus link_status = {};

    SenseDial_LowSide_FirmwareUpdatePhase firmware_phase =
        SenseDial_LowSide_FirmwareUpdatePhase_FIRMWARE_UPDATE_PHASE_IDLE;
    uint32_t firmware_received_bytes = 0;
    uint32_t firmware_expected_bytes = 0;
    char firmware_detail[81] = {};
};

struct MotorSharedConfig
{
    bool valid = false;
    uint32_t config_nonce = 0;

    int32_t position = 0;
    float sub_position_unit = 0.0f;
    int32_t min_position = 0;
    int32_t max_position = 0;

    float position_width_radians = 0.0f;
    float detent_strength_unit = 0.0f;
    float endstop_strength_unit = 0.0f;
    float snap_point = 0.0f;
    float snap_point_bias = 0.0f;
    int16_t led_hue = 0;

    uint8_t detent_positions_count = 0;
    int32_t detent_positions[5] = {};
    uint8_t override_detents_count = 0;
    MotorOverrideDetent override_detents[8] = {};

    uint8_t pole_pairs = 7;
    MotorSensorType sensor_type = MotorSensorType::Unspecified;
    MotorSensorDirection sensor_direction = MotorSensorDirection::Auto;
    MotorMotionType motion_type = MotorMotionType::Position;

    float voltage_limit = 5.0f;
    float velocity_limit = 20.0f;
    float current_limit = 1.2f;

    MotorPidConfig velocity_pid = {};
    MotorLowPassConfig velocity_lpf = {};
    MotorPidConfig current_pid = {3.0f, 300.0f, 0.0f, 0.0f};
    MotorLowPassConfig current_lpf = {0.006f};
    MotorHapticTuningConfig haptic_tuning = {};
};

struct MotorSharedCommand
{
    MotorCommandType type = MotorCommandType::None;

    SenseDial_LowSide_CalibrationType calibration_type =
        SenseDial_LowSide_CalibrationType_CALIBRATION_TYPE_UNSPECIFIED;
    uint8_t calibration_channel_id = 0;
    bool persist_calibration_result = false;
};

struct MotorSharedStatus
{
    bool core1_running = false;
    bool control_enabled = false;
    bool foc_initialized = false;
    bool driver_ready = false;
    bool sensor_ready = false;
    bool current_sense_ready = false;
    bool calibration_loaded = false;
    bool calibrated = false;
    bool fault_active = false;

    bool i2c_sda_high = false;
    bool i2c_scl_high = false;
    uint8_t i2c_detected_address = 0;
    uint8_t as5600_status = 0;
    bool enable_observed_high = false;
    float alignment_angle_before = 0.0f;
    float alignment_angle_after = 0.0f;

    uint32_t last_update_ms = 0;
    uint32_t control_cycle_count = 0;

    int32_t current_position = 0;
    float sub_position_unit = 0.0f;
    float shaft_angle_rad = 0.0f;
    float shaft_velocity_rads = 0.0f;
    float phase_current_a = 0.0f;
    float phase_current_b = 0.0f;
    float phase_current_c = 0.0f;
    uint32_t applied_config_nonce = 0;
};

struct LowSideSharedState
{
    ProtocolSharedState protocol = {};
    MotorSharedConfig motor_config = {};
    MotorSharedCommand motor_command = {};
    MotorSharedStatus motor_status = {};
};

namespace from_shared {
    // Explicit selector for shared::read(...).
    struct snapshot_t {};
    inline constexpr snapshot_t snapshot{};
}

void shared_memory_init();

namespace shared {
    LowSideSharedState read(from_shared::snapshot_t);
    void write(const MotorSharedConfig &config);
    void write(const MotorSharedCommand &command);
    void write(const MotorSharedStatus &status);
    void write(const LinkSharedStatus& status);
}
