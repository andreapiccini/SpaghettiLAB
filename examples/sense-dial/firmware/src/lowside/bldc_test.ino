#include <Wire.h>
#include <SimpleFOC.h>
#include <string.h>
#include <stdlib.h>

// =========================
// CONFIG HARDWARE
// =========================
#define EN_PIN 21
#define MOTOR_PP 7
#define SUPPLY_VOLTAGE 12.0f

// =========================
// SERIAL
// =========================
#define SERIAL_BAUD 115200
#define SERIAL_BUFFER_SIZE 96

char serialBuffer[SERIAL_BUFFER_SIZE];
uint8_t serialIndex = 0;

// =========================
// SENSORE AS5600
// =========================
MagneticSensorI2C sensor = MagneticSensorI2C(AS5600_I2C);

// =========================
// MOTORE + DRIVER
// =========================
BLDCMotor motor = BLDCMotor(MOTOR_PP);
BLDCDriver3PWM driver = BLDCDriver3PWM(18, 20, 22, EN_PIN);

// =========================
// CONFIG RUNTIME
// =========================
struct KnobConfig {
  int detents;
  float kp_detent;
  float kd_detent;
  float snap_boost;
  float max_voltage;
  float dead_zone;
};

KnobConfig config = {
  64,     // detents
  10.0f,  // kp_detent
  0.22f,  // kd_detent
  0.70f,  // snap_boost
  3.5f,   // max_voltage
  0.02f   // dead_zone
};

// Offset iniziale: zero logico del knob
float angle_offset = 0.0f;

// =========================
// FUNZIONI UTILI
// =========================
float normalizeSigned(float a) {
  while (a > PI)  a -= _2PI;
  while (a < -PI) a += _2PI;
  return a;
}

float getDetentStep() {
  if (config.detents <= 0) return _2PI;
  return _2PI / (float)config.detents;
}

float getNearestDetentAngle(float angle) {
  float detent_step = getDetentStep();
  float relative = normalizeSigned(angle - angle_offset);
  int idx = (int)round(relative / detent_step);
  return angle_offset + idx * detent_step;
}

void applyConfigToMotor() {
  motor.voltage_limit = config.max_voltage;
}

void printHelp() {
  Serial.println(F("Commands:"));
  Serial.println(F("  HELP"));
  Serial.println(F("  GET"));
  Serial.println(F("  STATUS"));
  Serial.println(F("  SET DETENTS <int>"));
  Serial.println(F("  SET KP <float>"));
  Serial.println(F("  SET KD <float>"));
  Serial.println(F("  SET SNAP <float>"));
  Serial.println(F("  SET MAXV <float>"));
  Serial.println(F("  SET DEADZONE <float>"));
  Serial.println(F("  SET OFFSET NOW"));
}

void printConfig() {
  Serial.println(F("CONFIG BEGIN"));
  Serial.print(F("DETENTS="));   Serial.println(config.detents);
  Serial.print(F("KP="));        Serial.println(config.kp_detent, 4);
  Serial.print(F("KD="));        Serial.println(config.kd_detent, 4);
  Serial.print(F("SNAP="));      Serial.println(config.snap_boost, 4);
  Serial.print(F("MAXV="));      Serial.println(config.max_voltage, 4);
  Serial.print(F("DEADZONE="));  Serial.println(config.dead_zone, 4);
  Serial.print(F("OFFSET="));    Serial.println(angle_offset, 6);
  Serial.println(F("CONFIG END"));
}

void printStatus() {
  float angle = motor.shaft_angle;
  float velocity = motor.shaft_velocity;
  float detent_step = getDetentStep();
  int detent_index = (int)round(normalizeSigned(angle - angle_offset) / detent_step);

  Serial.println(F("STATUS BEGIN"));
  Serial.print(F("ANGLE="));   Serial.println(angle, 6);
  Serial.print(F("VEL="));     Serial.println(velocity, 6);
  Serial.print(F("INDEX="));   Serial.println(detent_index);
  Serial.println(F("STATUS END"));
}

bool startsWith(const char* str, const char* prefix) {
  return strncmp(str, prefix, strlen(prefix)) == 0;
}

void processCommand(char* cmd) {
  // rimuovi eventuale CR finale
  size_t len = strlen(cmd);
  while (len > 0 && (cmd[len - 1] == '\r' || cmd[len - 1] == '\n' || cmd[len - 1] == ' ')) {
    cmd[len - 1] = '\0';
    len--;
  }

  if (len == 0) return;

  if (strcmp(cmd, "HELP") == 0) {
    printHelp();
    return;
  }

  if (strcmp(cmd, "GET") == 0) {
    printConfig();
    return;
  }

  if (strcmp(cmd, "STATUS") == 0) {
    printStatus();
    return;
  }

  if (strcmp(cmd, "SET OFFSET NOW") == 0) {
    angle_offset = sensor.getAngle();
    Serial.println(F("OK OFFSET UPDATED"));
    return;
  }

  if (startsWith(cmd, "SET ")) {
    char* token = strtok(cmd, " ");   // SET
    token = strtok(NULL, " ");        // key
    if (token == NULL) {
      Serial.println(F("ERR BAD COMMAND"));
      return;
    }

    char key[16];
    strncpy(key, token, sizeof(key) - 1);
    key[sizeof(key) - 1] = '\0';

    token = strtok(NULL, " ");        // value
    if (token == NULL) {
      Serial.println(F("ERR MISSING VALUE"));
      return;
    }

    if (strcmp(key, "DETENTS") == 0) {
      int v = atoi(token);
      if (v <= 0) {
        Serial.println(F("ERR DETENTS > 0"));
        return;
      }
      config.detents = v;
      Serial.println(F("OK"));
      return;
    }

    if (strcmp(key, "KP") == 0) {
      config.kp_detent = atof(token);
      Serial.println(F("OK"));
      return;
    }

    if (strcmp(key, "KD") == 0) {
      config.kd_detent = atof(token);
      Serial.println(F("OK"));
      return;
    }

    if (strcmp(key, "SNAP") == 0) {
      config.snap_boost = atof(token);
      Serial.println(F("OK"));
      return;
    }

    if (strcmp(key, "MAXV") == 0) {
      float v = atof(token);
      if (v <= 0.0f) {
        Serial.println(F("ERR MAXV > 0"));
        return;
      }
      config.max_voltage = v;
      applyConfigToMotor();
      Serial.println(F("OK"));
      return;
    }

    if (strcmp(key, "DEADZONE") == 0) {
      float v = atof(token);
      if (v < 0.0f) {
        Serial.println(F("ERR DEADZONE >= 0"));
        return;
      }
      config.dead_zone = v;
      Serial.println(F("OK"));
      return;
    }

    Serial.println(F("ERR UNKNOWN KEY"));
    return;
  }

  Serial.println(F("ERR UNKNOWN COMMAND"));
}

void handleSerial() {
  while (Serial.available() > 0) {
    char c = (char)Serial.read();

    if (c == '\n') {
      serialBuffer[serialIndex] = '\0';
      processCommand(serialBuffer);
      serialIndex = 0;
    } else {
      if (serialIndex < SERIAL_BUFFER_SIZE - 1) {
        serialBuffer[serialIndex++] = c;
      } else {
        // buffer pieno: reset sicuro
        serialIndex = 0;
        Serial.println(F("ERR BUFFER OVERFLOW"));
      }
    }
  }
}

// =========================
// SETUP
// =========================
void setup() {
  Serial.begin(SERIAL_BAUD);
  Wire.setSDA(4);
  Wire.setSCL(5);
  Wire.begin();

 Wire.setClock(400000);

  sensor.init();

  driver.voltage_power_supply = SUPPLY_VOLTAGE;
  driver.init();

  motor.linkDriver(&driver);
  motor.linkSensor(&sensor);

  motor.foc_modulation = FOCModulationType::SinePWM;
  motor.torque_controller = TorqueControlType::voltage;
  motor.controller = MotionControlType::torque;

  motor.voltage_limit = config.max_voltage;
  motor.velocity_limit = 20.0f;

  motor.init();
  motor.initFOC();

  angle_offset = sensor.getAngle();

  Serial.println(F("Knob detent ready"));
  printHelp();
  printConfig();
}

// =========================
// LOOP
// =========================
void loop() {
  motor.loopFOC();
  handleSerial();

  float angle = motor.shaft_angle;
  float velocity = motor.shaft_velocity;
  float detent_step = getDetentStep();

  float detent_angle = getNearestDetentAngle(angle);
  float err = normalizeSigned(detent_angle - angle);

  float command = config.kp_detent * err - config.kd_detent * velocity;

  if (fabs(err) < (detent_step * 0.20f)) {
    float sign = (err >= 0.0f) ? 1.0f : -1.0f;
    command += sign * config.snap_boost * (1.0f - fabs(err) / (detent_step * 0.20f));
  }

  if (fabs(err) < config.dead_zone) {
    command = 0.0f;
  }

  if (command > config.max_voltage)  command = config.max_voltage;
  if (command < -config.max_voltage) command = -config.max_voltage;

  motor.move(command);

  static uint32_t lastPrint = 0;
  if (millis() - lastPrint > 100) {
    lastPrint = millis();
    int detent_index = (int)round(normalizeSigned(angle - angle_offset) / detent_step);

    Serial.print(F("DBG angle: "));
    Serial.print(angle, 3);
    Serial.print(F(" vel: "));
    Serial.print(velocity, 3);
    Serial.print(F(" err: "));
    Serial.print(err, 3);
    Serial.print(F(" idx: "));
    Serial.print(detent_index);
    Serial.print(F(" cmd: "));
    Serial.println(command, 3);
  }
}