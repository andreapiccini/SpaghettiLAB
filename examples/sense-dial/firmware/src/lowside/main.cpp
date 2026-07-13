#include <Arduino.h>
#include <EEPROM.h>
#include <SimpleFOC.h>
#include <encoders/smoothing/SmoothingSensor.h>
#include <Wire.h>
#include <app_layer.h>
#include <link_layer.h>
#include <sensedial_lowside.pb.h>
#include <shared_memory.h>

// Arduino-Pico otherwise splits a single 8 KB stack into two 4 KB stacks.
// SimpleFOC initialization and the motor loop need the dedicated core-1 stack.
bool core1_separate_stack = true;

// Core 0 owns both serial links and the protobuf application layer.
static HardwareSerial &HostStream = Serial;
// Dedicated hardware UART1 toward the ESP32-S3 high-side.
// MyRP_2350B maps Serial2 to GPIO 8 (TX) and GPIO 9 (RX).
static HardwareSerial &HighSideStream = Serial2;

static constexpr uint32_t HOST_STREAM_BAUD = 115200;
static constexpr uint32_t HIGH_SIDE_STREAM_BAUD = 115200;
static constexpr int STATUS_LED_PIN = 3;
static constexpr int MOTOR_PWM_A_PIN = 10;
static constexpr int MOTOR_PWM_B_PIN = 11;
static constexpr int MOTOR_PWM_C_PIN = 29;
static constexpr int MOTOR_ENABLE_PIN = 12;
static constexpr int DRIVER_RESET_PIN = 8;
static volatile bool shared_memory_ready = false;

void setup()
{
    pinMode(STATUS_LED_PIN, OUTPUT);
    digitalWrite(STATUS_LED_PIN, HIGH);

    // Keep the complete power stage inactive until core 1 has initialized it.
    pinMode(MOTOR_PWM_A_PIN, OUTPUT);
    pinMode(MOTOR_PWM_B_PIN, OUTPUT);
    pinMode(MOTOR_PWM_C_PIN, OUTPUT);
    digitalWrite(MOTOR_PWM_A_PIN, LOW);
    digitalWrite(MOTOR_PWM_B_PIN, LOW);
    digitalWrite(MOTOR_PWM_C_PIN, LOW);
    pinMode(MOTOR_ENABLE_PIN, OUTPUT);
    digitalWrite(MOTOR_ENABLE_PIN, LOW);
    pinMode(DRIVER_RESET_PIN, OUTPUT);
    digitalWrite(DRIVER_RESET_PIN, HIGH);

    HostStream.begin(HOST_STREAM_BAUD);
    HighSideStream.begin(HIGH_SIDE_STREAM_BAUD);

    const uint32_t start = millis();
    while (!Serial && (millis() - start < 2000)) {
        delay(10);
    }

    shared_memory_init();
    shared_memory_ready = true;
    link_layer_init(HostStream, HighSideStream);
}

void loop()
{
    app_layer_run();
}

// Core 1 exclusively owns the motor driver, AS5600 and the FOC loop.
namespace motor_core {

static constexpr int PWM_A_PIN = MOTOR_PWM_A_PIN;
static constexpr int PWM_B_PIN = MOTOR_PWM_B_PIN;
static constexpr int PWM_C_PIN = MOTOR_PWM_C_PIN;
static constexpr int DRIVER_ENABLE_PIN = MOTOR_ENABLE_PIN;
static constexpr int AS5600_SDA_PIN = 16;
static constexpr int AS5600_SCL_PIN = 17;
static constexpr uint8_t AS5600_ADDRESS = 0x36;
static constexpr int CURRENT_A_PIN = 26;
static constexpr int CURRENT_B_PIN = 27;
static constexpr int CURRENT_C_PIN = 28;
static constexpr float CURRENT_SHUNT_OHMS = 0.010f;
static constexpr float CURRENT_AMP_GAIN = 20.0f;

static constexpr int MOTOR_POLE_PAIRS = 7;
static constexpr float DRIVER_SUPPLY_VOLTAGE = 9.0f;
static constexpr long DRIVER_PWM_FREQUENCY_HZ = 48000;
static constexpr float STARTUP_VOLTAGE_LIMIT = 5.0f;
static constexpr float STARTUP_VELOCITY_LIMIT = 1.0f;
static constexpr float MAX_SAFE_TEST_VOLTAGE = 9.0f;
static constexpr uint32_t CALIBRATION_MAGIC = 0x53444341; // "SDCA"
static constexpr uint16_t CALIBRATION_VERSION = 1;
static constexpr uint32_t FACTORY_SETTINGS_MAGIC = 0x53444641; // "SDFA"
static constexpr uint32_t USER_SETTINGS_MAGIC = 0x53445553; // "SDUS"
static constexpr uint16_t SETTINGS_VERSION = 2;
static constexpr int FACTORY_SETTINGS_EEPROM_ADDRESS = 128;
static constexpr int USER_SETTINGS_EEPROM_ADDRESS = 512;
static constexpr size_t EEPROM_SIZE = 1024;

struct PersistedMotorCalibration
{
    uint32_t magic;
    uint16_t version;
    uint16_t size;
    float zero_electric_angle;
    uint8_t sensor_direction;
    int8_t current_pin_a;
    int8_t current_pin_b;
    int8_t current_pin_c;
    float current_gain_a;
    float current_gain_b;
    float current_gain_c;
    uint32_t checksum;
};

struct PersistedStaticSettings
{
    uint32_t magic;
    uint16_t version;
    uint16_t size;
    MotorSharedConfig config;
    uint32_t checksum;
};

static_assert(sizeof(PersistedStaticSettings) <=
              (USER_SETTINGS_EEPROM_ADDRESS - FACTORY_SETTINGS_EEPROM_ADDRESS),
              "Persisted factory settings overlap the user EEPROM slot");

MagneticSensorI2C sensor(AS5600_I2C);
BLDCMotor motor(MOTOR_POLE_PAIRS);
SmoothingSensor smooth_sensor(sensor, motor);
BLDCDriver3PWM driver(PWM_A_PIN, PWM_B_PIN, PWM_C_PIN, DRIVER_ENABLE_PIN);
InlineCurrentSense current_sense(
    CURRENT_SHUNT_OHMS,
    CURRENT_AMP_GAIN,
    CURRENT_A_PIN,
    CURRENT_B_PIN,
    CURRENT_C_PIN);
MotorSharedStatus status = {};

static float zero_angle = 0.0f;
static MotorSharedConfig active_config = {};
static uint32_t applied_nonce = 0;
static bool ready = false;
static bool control_enabled = false;
static int32_t detent_center_position = 0;
static bool motor_awake = false;
static float motor_sleep_reference_angle = 0.0f;
static bool motor_initialized = false;
static uint32_t last_foc_retry_ms = 0;
static uint8_t foc_attempt_count = 0;
static uint32_t quiet_since_ms = 0;
static uint32_t idle_since_ms = 0;
static float filtered_torque_command = 0.0f;
static uint32_t last_torque_filter_us = 0;
static uint32_t config_persist_due_ms = 0;
static constexpr uint32_t CONFIG_PERSIST_DEBOUNCE_MS = 2000;
static constexpr uint32_t IDLE_CENTER_CORRECTION_DELAY_MS = 500;
static constexpr float IDLE_CENTER_CORRECTION_MAX_ANGLE_RAD = 5.0f * _PI / 180.0f;
static constexpr float IDLE_CENTER_CORRECTION_ALPHA = 0.0005f;

static uint32_t calibrationChecksum(const PersistedMotorCalibration &calibration)
{
    const auto *bytes = reinterpret_cast<const uint8_t *>(&calibration);
    uint32_t hash = 2166136261u;
    for (size_t i = 0; i < offsetof(PersistedMotorCalibration, checksum); ++i) {
        hash ^= bytes[i];
        hash *= 16777619u;
    }
    return hash;
}

static uint32_t settingsChecksum(const PersistedStaticSettings &settings)
{
    const auto *bytes = reinterpret_cast<const uint8_t *>(&settings);
    uint32_t hash = 2166136261u;
    for (size_t i = 0; i < offsetof(PersistedStaticSettings, checksum); ++i) {
        hash ^= bytes[i];
        hash *= 16777619u;
    }
    return hash;
}

static bool loadSettingsRecord(int address, uint32_t magic, PersistedStaticSettings &settings)
{
    EEPROM.get(address, settings);
    return settings.magic == magic &&
        settings.version == SETTINGS_VERSION &&
        settings.size == sizeof(settings) &&
        settings.checksum == settingsChecksum(settings) &&
        settings.config.pole_pairs >= 1 && settings.config.pole_pairs <= 32;
}

static PersistedStaticSettings defaultStaticSettings(uint32_t magic)
{
    PersistedStaticSettings settings = {};
    settings.magic = magic;
    settings.version = SETTINGS_VERSION;
    settings.size = sizeof(settings);
    settings.config = MotorSharedConfig{};
    settings.config.valid = false;
    settings.config.config_nonce = 0;
    settings.config.position = 0;
    settings.config.min_position = 0;
    settings.config.max_position = 23;
    settings.config.position_width_radians = _2PI / 24.0f;
    settings.config.detent_strength_unit = 1.2f;
    settings.config.endstop_strength_unit = 2.2f;
    settings.config.snap_point = 0.55f;
    settings.config.pole_pairs = MOTOR_POLE_PAIRS;
    settings.config.sensor_direction = MotorSensorDirection::Auto;
    settings.config.sensor_type = MotorSensorType::MagneticEncoder;
    settings.config.motion_type = MotorMotionType::Torque;
    settings.config.voltage_limit = 5.0f;
    settings.config.velocity_limit = 8.0f;
    settings.checksum = settingsChecksum(settings);
    return settings;
}

static bool ensureFactorySettings(PersistedStaticSettings &factory)
{
    if (loadSettingsRecord(FACTORY_SETTINGS_EEPROM_ADDRESS, FACTORY_SETTINGS_MAGIC, factory)) {
        return true;
    }
    factory = defaultStaticSettings(FACTORY_SETTINGS_MAGIC);
    EEPROM.put(FACTORY_SETTINGS_EEPROM_ADDRESS, factory);
    return EEPROM.commit();
}

static bool loadStaticSettings(PersistedStaticSettings &settings)
{
    if (loadSettingsRecord(USER_SETTINGS_EEPROM_ADDRESS, USER_SETTINGS_MAGIC, settings)) {
        return true;
    }
    PersistedStaticSettings factory = {};
    if (!ensureFactorySettings(factory)) return false;
    settings = factory;
    return true;
}

static bool saveStaticSettings(const MotorSharedConfig &config)
{
    PersistedStaticSettings previous = {};
    const bool had_previous = loadStaticSettings(previous);
    const bool hardware_changed = !had_previous ||
        previous.config.pole_pairs != config.pole_pairs ||
        previous.config.sensor_direction != config.sensor_direction;
    PersistedStaticSettings settings = {};
    settings.magic = USER_SETTINGS_MAGIC;
    settings.version = SETTINGS_VERSION;
    settings.size = sizeof(settings);
    settings.config = config;
    settings.config.valid = false;
    settings.config.config_nonce = 0;
    settings.config.pole_pairs = constrain(config.pole_pairs, uint8_t{1}, uint8_t{32});
    settings.checksum = settingsChecksum(settings);

    // Avoid an EEPROM/flash erase when the normalized profile is already the
    // one on disk (notably on every standalone boot).
    PersistedStaticSettings stored = {};
    if (loadSettingsRecord(USER_SETTINGS_EEPROM_ADDRESS, USER_SETTINGS_MAGIC, stored) &&
        stored.checksum == settings.checksum) {
        return true;
    }
    EEPROM.put(USER_SETTINGS_EEPROM_ADDRESS, settings);

    if (hardware_changed) {
        const uint32_t invalid_magic = 0;
        EEPROM.put(0, invalid_magic);
    }
    return EEPROM.commit();
}

static bool restoreFactorySettings()
{
    PersistedStaticSettings factory = {};
    if (!ensureFactorySettings(factory)) return false;
    PersistedStaticSettings previous = {};
    const bool had_previous = loadStaticSettings(previous);
    const bool hardware_changed = !had_previous ||
        previous.config.pole_pairs != factory.config.pole_pairs ||
        previous.config.sensor_direction != factory.config.sensor_direction;
    factory.magic = USER_SETTINGS_MAGIC;
    factory.checksum = settingsChecksum(factory);
    EEPROM.put(USER_SETTINGS_EEPROM_ADDRESS, factory);
    if (hardware_changed) {
        const uint32_t invalid_magic = 0;
        EEPROM.put(0, invalid_magic);
    }
    return EEPROM.commit();
}

static bool validCurrentPin(int pin)
{
    return pin >= CURRENT_A_PIN && pin <= CURRENT_C_PIN;
}

static bool loadCalibration()
{
    PersistedMotorCalibration calibration = {};
    EEPROM.get(0, calibration);
    if (calibration.magic != CALIBRATION_MAGIC ||
        calibration.version != CALIBRATION_VERSION ||
        calibration.size != sizeof(calibration) ||
        calibration.checksum != calibrationChecksum(calibration) ||
        !isfinite(calibration.zero_electric_angle) ||
        (calibration.sensor_direction != static_cast<uint8_t>(Direction::CW) &&
         calibration.sensor_direction != static_cast<uint8_t>(Direction::CCW)) ||
        !validCurrentPin(calibration.current_pin_a) ||
        !validCurrentPin(calibration.current_pin_b) ||
        !validCurrentPin(calibration.current_pin_c) ||
        !isfinite(calibration.current_gain_a) ||
        !isfinite(calibration.current_gain_b) ||
        !isfinite(calibration.current_gain_c)) {
        return false;
    }

    const float offsets[] = {
        current_sense.offset_ia,
        current_sense.offset_ib,
        current_sense.offset_ic,
    };
    current_sense.pinA = calibration.current_pin_a;
    current_sense.pinB = calibration.current_pin_b;
    current_sense.pinC = calibration.current_pin_c;
    current_sense.offset_ia = offsets[current_sense.pinA - CURRENT_A_PIN];
    current_sense.offset_ib = offsets[current_sense.pinB - CURRENT_A_PIN];
    current_sense.offset_ic = offsets[current_sense.pinC - CURRENT_A_PIN];
    current_sense.gain_a = calibration.current_gain_a;
    current_sense.gain_b = calibration.current_gain_b;
    current_sense.gain_c = calibration.current_gain_c;
    current_sense.skip_align = true;
    motor.zero_electric_angle = calibration.zero_electric_angle;
    motor.sensor_direction = static_cast<Direction>(calibration.sensor_direction);
    return true;
}

static bool saveCalibration()
{
    PersistedMotorCalibration calibration = {};
    calibration.magic = CALIBRATION_MAGIC;
    calibration.version = CALIBRATION_VERSION;
    calibration.size = sizeof(calibration);
    calibration.zero_electric_angle = motor.zero_electric_angle;
    calibration.sensor_direction = static_cast<uint8_t>(motor.sensor_direction);
    calibration.current_pin_a = current_sense.pinA;
    calibration.current_pin_b = current_sense.pinB;
    calibration.current_pin_c = current_sense.pinC;
    calibration.current_gain_a = current_sense.gain_a;
    calibration.current_gain_b = current_sense.gain_b;
    calibration.current_gain_c = current_sense.gain_c;
    calibration.checksum = calibrationChecksum(calibration);
    EEPROM.put(0, calibration);
    return EEPROM.commit();
}

static void publishStatus()
{
    status.core1_running = true;
    status.control_enabled = control_enabled;
    status.calibrated = ready;
    status.last_update_ms = millis();
    status.control_cycle_count++;
    status.shaft_angle_rad = motor.shaft_angle;
    status.shaft_velocity_rads = motor.shaft_velocity;
    // Do not sample the inline current sense from the status path. On RP2350
    // this ADC read can block core 1 immediately after motor.enable(), before
    // the applied configuration nonce is published. Voltage-mode haptics do
    // not need phase-current telemetry.
    status.phase_current_a = 0.0f;
    status.phase_current_b = 0.0f;
    status.phase_current_c = 0.0f;
    status.applied_config_nonce = applied_nonce;
    shared::write(status);
}

static bool as5600Present()
{
    Wire.beginTransmission(AS5600_ADDRESS);
    return Wire.endTransmission() == 0;
}

static uint8_t scanI2cBus()
{
    for (uint8_t address = 1; address < 127; ++address) {
        Wire.beginTransmission(address);
        if (Wire.endTransmission() == 0) {
            return address;
        }
    }
    return 0;
}

static uint8_t readAs5600Register(uint8_t reg)
{
    Wire.beginTransmission(AS5600_ADDRESS);
    Wire.write(reg);
    if (Wire.endTransmission(false) != 0 || Wire.requestFrom(AS5600_ADDRESS, uint8_t{1}) != 1) {
        return 0;
    }
    return Wire.read();
}

static void applyConfig(const MotorSharedConfig &config)
{
    const float voltage = constrain(config.voltage_limit, 0.1f, MAX_SAFE_TEST_VOLTAGE);
    const float velocity = config.velocity_limit > 0.0f
        ? config.velocity_limit
        : STARTUP_VELOCITY_LIMIT;
    const bool first_config = !active_config.valid;

    active_config = config;
    motor.updateMotionControlType(MotionControlType::torque);
    motor.voltage_limit = voltage;
    driver.voltage_limit = voltage;
    motor.current_limit = constrain(config.current_limit, 0.1f, 2.5f);
    motor.velocity_limit = velocity;
    motor.PID_velocity.P = config.velocity_pid.p;
    motor.PID_velocity.I = config.velocity_pid.i;
    motor.PID_velocity.D = config.velocity_pid.d;
    motor.PID_velocity.output_ramp = config.velocity_pid.output_ramp;
    motor.LPF_velocity.Tf = config.velocity_lpf.time_constant;
    motor.PID_current_q.P = config.current_pid.p;
    motor.PID_current_q.I = config.current_pid.i;
    motor.PID_current_q.D = config.current_pid.d;
    motor.PID_current_q.output_ramp = config.current_pid.output_ramp;
    motor.PID_current_d = motor.PID_current_q;
    motor.LPF_current_q.Tf = config.current_lpf.time_constant;
    motor.LPF_current_d.Tf = config.current_lpf.time_constant;

    const float width = config.position_width_radians > 0.0f
        ? config.position_width_radians
        : _2PI;
    if (first_config) {
        // The first profile adopts the current physical angle as its requested
        // logical position instead of pulling the knob across the dial.
        zero_angle = motor.shaft_angle -
            (static_cast<float>(config.position) + config.sub_position_unit) * width;
        detent_center_position = config.position;
    } else {
        detent_center_position = constrain(
            static_cast<int32_t>(lroundf((motor.shaft_angle - zero_angle) / width)),
            config.min_position,
            config.max_position);
    }
    applied_nonce = config.config_nonce;
    status.fault_active = false;
    motor.enable();
    motor_awake = true;
    motor_sleep_reference_angle = motor.shaft_angle;
    filtered_torque_command = 0.0f;
    last_torque_filter_us = 0;
    quiet_since_ms = 0;
    idle_since_ms = 0;
    control_enabled = true;
    publishStatus();
}

static float hapticTorque(const MotorSharedConfig &config)
{
    const float width = config.position_width_radians > 0.0f
        ? config.position_width_radians
        : _2PI;
    const int32_t min_position = config.min_position;
    const int32_t max_position = config.max_position >= config.min_position
        ? config.max_position
        : config.min_position;
    const float snap = constrain(config.snap_point, 0.12f, 0.49f);
    const float bias = constrain(config.snap_point_bias, -1.0f, 1.0f) * 0.12f;
    float center_angle = zero_angle + static_cast<float>(detent_center_position) * width;
    float offset_unit = (motor.shaft_angle - center_angle) / width;

    if (offset_unit > constrain(snap + bias, 0.08f, 0.49f) &&
        detent_center_position < max_position) {
        ++detent_center_position;
    } else if (offset_unit < -constrain(snap - bias, 0.08f, 0.49f) &&
               detent_center_position > min_position) {
        --detent_center_position;
    }

    center_angle = zero_angle + static_cast<float>(detent_center_position) * width;
    const float offset = motor.shaft_angle - center_angle;
    const bool at_endstop =
        (detent_center_position == min_position && offset < 0.0f) ||
        (detent_center_position == max_position && offset > 0.0f);
    float strength = at_endstop ? config.endstop_strength_unit : config.detent_strength_unit;
    if (!at_endstop && config.detent_positions_count > 0) {
        bool enabled = false;
        for (uint8_t i = 0; i < config.detent_positions_count; ++i) {
            enabled |= config.detent_positions[i] == detent_center_position;
        }
        if (!enabled) strength = 0.0f;
    }
    if (!at_endstop) {
        for (uint8_t i = 0; i < config.override_detents_count; ++i) {
            if (config.override_detents[i].position == detent_center_position) {
                strength = config.override_detents[i].strength;
                break;
            }
        }
    }
    strength = constrain(strength, 0.0f, 5.0f);
    const float detent_gain = config.haptic_tuning.detent_gain > 0.0f
        ? config.haptic_tuning.detent_gain : 0.42f;
    const float endstop_gain = config.haptic_tuning.endstop_gain > 0.0f
        ? config.haptic_tuning.endstop_gain : 0.65f;
    const float stiffness_volts = strength * (at_endstop ? endstop_gain : detent_gain);
    float torque = -stiffness_volts * constrain(offset / (width * 0.5f), -1.0f, 1.0f);

    // Around the center command exactly zero: sensor noise must not become an
    // audible high-frequency correction.
    const float deadband = config.haptic_tuning.deadband_fraction > 0.0f
        ? config.haptic_tuning.deadband_fraction : 0.035f;
    if (fabsf(offset) < width * constrain(deadband, 0.0f, 0.45f)) {
        return 0.0f;
    }

    // Keep damping intentionally small: AS5600 velocity jitter can otherwise
    // become an audible alternating voltage on the phases.
    torque -= constrain(motor.shaft_velocity * 0.004f, -0.08f, 0.08f);
    return constrain(torque, -motor.voltage_limit, motor.voltage_limit);
}

static float quietTorqueCommand(float target, const MotorSharedConfig &config)
{
    const uint32_t now = micros();
    const float dt = last_torque_filter_us == 0
        ? 0.001f
        : constrain((now - last_torque_filter_us) * 1e-6f, 0.0002f, 0.02f);
    last_torque_filter_us = now;

    if (fabsf(target) < 0.001f) {
        filtered_torque_command = 0.0f;
        return 0.0f;
    }

    const float tau = constrain(
        config.haptic_tuning.torque_filter_time_constant > 0.0f
            ? config.haptic_tuning.torque_filter_time_constant : 0.012f,
        0.0005f,
        0.25f);
    const float alpha = dt / (tau + dt);
    filtered_torque_command += (target - filtered_torque_command) * alpha;

    const float slew = config.haptic_tuning.torque_slew_rate > 0.0f
        ? config.haptic_tuning.torque_slew_rate : 55.0f;
    const float max_step = constrain(slew, 0.1f, 500.0f) * dt;
    const float delta = constrain(filtered_torque_command - target, -max_step, max_step);
    filtered_torque_command = target + delta;
    return filtered_torque_command;
}

static bool tryInitializeFoc()
{
    ++foc_attempt_count;
    status.fault_active = false;
    status.foc_initialized = false;
    sensor.update();
    status.alignment_angle_before = sensor.getAngle();
    driver.enable();
    status.enable_observed_high = digitalRead(DRIVER_ENABLE_PIN) == HIGH;
    publishStatus();

    if (!motor.initFOC()) {
        sensor.update();
        status.alignment_angle_after = sensor.getAngle();
        driver.disable();
        digitalWrite(DRIVER_ENABLE_PIN, LOW);
        status.enable_observed_high = digitalRead(DRIVER_ENABLE_PIN) == HIGH;
        status.fault_active = true;
        publishStatus();
        return false;
    }

    sensor.update();
    status.alignment_angle_after = sensor.getAngle();
    zero_angle = motor.shaft_angle;
    status.foc_initialized = true;
    if (!status.calibration_loaded && saveCalibration()) {
        status.calibration_loaded = true;
    }
    ready = true;
    motor.disable();
    motor_awake = false;
    control_enabled = false;
    publishStatus();
    return true;
}

} // namespace motor_core

// Arduino-Pico runs setup1()/loop1() on the RP2350's second ARM core.
void setup1()
{
    using namespace motor_core;

    // Core 0 owns initialization of the cross-core shared-memory lock.
    while (!shared_memory_ready) {
        delay(1);
    }
    EEPROM.begin(EEPROM_SIZE);
    status.core1_running = true;
    PersistedStaticSettings static_settings = {};
    const bool static_settings_loaded = loadStaticSettings(static_settings);
    if (static_settings_loaded) {
        motor.pole_pairs = static_settings.config.pole_pairs;
        auto persisted_config = static_settings.config;
        // A persisted profile is a complete standalone configuration. Give it
        // a local revision so core 1 applies it as soon as FOC is ready.
        persisted_config.valid = true;
        persisted_config.config_nonce = 1;
        shared::write(persisted_config);
    }

    Wire.setSDA(AS5600_SDA_PIN);
    Wire.setSCL(AS5600_SCL_PIN);
    Wire.begin();
    Wire.setClock(400000);
    // Never let a missing/resetting encoder stop core 1 indefinitely.  The
    // Arduino-Pico implementation resets the I2C peripheral after this timeout.
    Wire.setTimeout(5, true);

    status.i2c_sda_high = digitalRead(AS5600_SDA_PIN) == HIGH;
    status.i2c_scl_high = digitalRead(AS5600_SCL_PIN) == HIGH;
    status.i2c_detected_address = scanI2cBus();

    if (!as5600Present()) {
        pinMode(DRIVER_ENABLE_PIN, OUTPUT);
        digitalWrite(DRIVER_ENABLE_PIN, LOW);
        status.fault_active = true;
        publishStatus();
        return;
    }
    status.sensor_ready = true;
    sensor.init(&Wire);
    status.as5600_status = readAs5600Register(0x0B);

    driver.voltage_power_supply = DRIVER_SUPPLY_VOLTAGE;
    driver.voltage_limit = STARTUP_VOLTAGE_LIMIT;
    // The RP2350 backend supports up to 66 kHz. 48 kHz moves the carrier and
    // its strongest mechanical excitation further above hearing while retaining
    // ample PWM resolution.
    driver.pwm_frequency = DRIVER_PWM_FREQUENCY_HZ;
    if (!driver.init()) {
        status.fault_active = true;
        publishStatus();
        return;
    }
    status.driver_ready = true;

    // Stable haptic control uses voltage torque. Inline current sensing is not
    // part of this control path, so do not initialize/link it or ask initFOC()
    // to perform a second, unnecessary current-sense alignment.
    status.current_sense_ready = false;

    motor.linkDriver(&driver);
    // Read the comparatively slow I2C encoder once every four control cycles;
    // SmoothingSensor extrapolates the intervening angles from filtered motor
    // velocity, reducing quantization buzz without adding control lag.
    smooth_sensor.sensor_downsample = 3;
    motor.linkSensor(&smooth_sensor);
    motor.controller = MotionControlType::torque;
    motor.torque_controller = TorqueControlType::voltage;
    motor.voltage_limit = STARTUP_VOLTAGE_LIMIT;
    motor.voltage_sensor_align = STARTUP_VOLTAGE_LIMIT;
    motor.velocity_limit = STARTUP_VELOCITY_LIMIT;
    motor.P_angle.P = 4.0f;
    motor.PID_velocity.P = 0.2f;
    motor.PID_velocity.I = 2.0f;
    motor.LPF_velocity.Tf = 0.01f;

    status.calibration_loaded = loadCalibration();
    if (static_settings_loaded) {
        const auto direction = static_settings.config.sensor_direction;
        if (direction == MotorSensorDirection::Clockwise) motor.sensor_direction = Direction::CW;
        if (direction == MotorSensorDirection::CounterClockwise) motor.sensor_direction = Direction::CCW;
    }
    if (!motor.init()) {
        driver.disable();
        status.fault_active = true;
        publishStatus();
        return;
    }
    motor_initialized = true;
    tryInitializeFoc();
}

void loop1()
{
    using namespace motor_core;
    const LowSideSharedState snapshot = shared::read(from_shared::snapshot);
    if (snapshot.motor_command.type == MotorCommandType::SaveConfiguration) {
        saveStaticSettings(snapshot.motor_config);
        shared::write(MotorSharedCommand{});
    }
    if (snapshot.motor_command.type == MotorCommandType::RestoreDefaults) {
        restoreFactorySettings();
        shared::write(MotorSharedCommand{});
    }

    // Recovery commands must remain available even when FOC initialization
    // failed, otherwise a bad persisted hardware setting could not be reset.
    if (!ready) {
        if (motor_initialized && foc_attempt_count < 2 &&
            millis() - last_foc_retry_ms >= 2500) {
            last_foc_retry_ms = millis();
            tryInitializeFoc();
        }
        delay(10);
        return;
    }
    if (snapshot.motor_config.valid && snapshot.motor_config.config_nonce != applied_nonce) {
        applyConfig(snapshot.motor_config);
        // Persist only after the profile has remained unchanged for a while;
        // live sliders therefore produce one flash write, not one per sample.
        config_persist_due_ms = millis() + CONFIG_PERSIST_DEBOUNCE_MS;
        delay(1);
        return;
    }
    if (config_persist_due_ms != 0 &&
        static_cast<int32_t>(millis() - config_persist_due_ms) >= 0) {
        saveStaticSettings(active_config);
        config_persist_due_ms = 0;
    }

    const bool run_control_loop = active_config.valid && control_enabled;
    if (run_control_loop) {
        motor.loopFOC();
        if (!motor_awake) {
            // move() still refreshes shaft angle/velocity while disabled.
            motor.move(0.0f);
        }
        const float torque = quietTorqueCommand(hapticTorque(active_config), active_config);
        const float wake_width = active_config.position_width_radians > 0.0f
            ? active_config.position_width_radians : _2PI;
        // While asleep, residual centering error must not immediately wake the
        // phases and recreate the stationary whine. Wake on actual hand motion.
        const bool should_wake =
            fabsf(motor.shaft_angle - motor_sleep_reference_angle) > wake_width * 0.025f ||
            fabsf(motor.shaft_velocity) > 0.08f;
        if (!motor_awake && should_wake) {
            motor.enable();
            motor_awake = true;
            quiet_since_ms = 0;
            idle_since_ms = 0;
        }
        if (motor_awake) {
            motor.move(torque);
            const float width = active_config.position_width_radians > 0.0f
                ? active_config.position_width_radians : _2PI;
            float center_angle = zero_angle +
                static_cast<float>(detent_center_position) * width;
            float offset = motor.shaft_angle - center_angle;
            const bool at_endstop =
                (detent_center_position == active_config.min_position && offset < 0.0f) ||
                (detent_center_position == active_config.max_position && offset > 0.0f);

            // Sensor quantisation can leave a tiny, continuously corrected
            // error at rest. After the hand has been still for 500 ms, let the
            // active detent center follow that resting angle very slowly. This
            // removes the residual phase excitation without changing detents
            // while the user is turning the knob or pushing an endstop.
            if (fabsf(motor.shaft_velocity) < 0.05f) {
                if (idle_since_ms == 0) idle_since_ms = millis();
            } else {
                idle_since_ms = 0;
            }
            if (!at_endstop && idle_since_ms != 0 &&
                millis() - idle_since_ms >= IDLE_CENTER_CORRECTION_DELAY_MS &&
                fabsf(offset) < IDLE_CENTER_CORRECTION_MAX_ANGLE_RAD) {
                zero_angle += offset * IDLE_CENTER_CORRECTION_ALPHA;
                center_angle = zero_angle +
                    static_cast<float>(detent_center_position) * width;
                offset = motor.shaft_angle - center_angle;
            }
            const float settle_fraction = at_endstop
                ? active_config.haptic_tuning.endstop_settle_fraction
                : active_config.haptic_tuning.detent_settle_fraction;
            const bool settled = settle_fraction > 0.0f &&
                fabsf(offset) <= width * constrain(settle_fraction, 0.0f, 0.45f);
            const bool stationary_near_center =
                !at_endstop &&
                fabsf(motor.shaft_velocity) < 0.03f &&
                fabsf(offset) <= width * 0.12f;
            const bool quiet = fabsf(torque) < 0.015f || settled || stationary_near_center;
            if (quiet) {
                if (quiet_since_ms == 0) quiet_since_ms = millis();
                const uint32_t idle_release_ms = static_cast<uint32_t>(constrain(
                    active_config.haptic_tuning.idle_release_ms > 0.0f
                        ? active_config.haptic_tuning.idle_release_ms : 180.0f,
                    10.0f,
                    5000.0f));
                if (millis() - quiet_since_ms >= idle_release_ms) {
                    motor.disable();
                    motor_awake = false;
                    motor_sleep_reference_angle = motor.shaft_angle;
                    quiet_since_ms = 0;
                    idle_since_ms = 0;
                }
            } else {
                quiet_since_ms = 0;
            }
        }
    }

    const float width = snapshot.motor_config.position_width_radians > 0.0f
        ? snapshot.motor_config.position_width_radians
        : _2PI;
    const float relative_position = (motor.shaft_angle - zero_angle) / width;
    status.current_position = static_cast<int32_t>(floorf(relative_position));
    status.sub_position_unit = relative_position - static_cast<float>(status.current_position);

    static uint32_t last_publish_ms = 0;
    if (millis() - last_publish_ms >= 10) {
        last_publish_ms = millis();
        publishStatus();
    }
}
