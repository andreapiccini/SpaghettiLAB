#pragma once

#include <Arduino.h>
#include "shared_memory.h"

extern "C" {
#include "sensedial_lowside.pb.h"
}

// pack() and unpack() are semantic pass-throughs.
// They keep call sites explicit about direction without adding conversion logic.
//
// Usage:
//   send_to_host(pack(to_host::ack(nonce)));
//   send_to_highside(pack(to_highside::dial_state(nonce, snap)));
//   shared::write(pack(to_shared::dial_config(msg.payload.dial_config)));
//   const auto snap = shared::read(unpack(from_shared::snapshot));

template<typename T>
inline T pack(T val) { return val; }

template<typename T>
inline T unpack(T val) { return val; }

// ── to_shared:: ───────────────────────────────────────────────────────────
// Build shared-memory structs from incoming proto messages.
// Pass the result to shared::write(pack(...)).

namespace to_shared {
    MotorSharedConfig  dial_config(const SenseDial_LowSide_DialConfig &src);
    MotorSharedCommand calibration_command(const SenseDial_LowSide_CalibrationCommand &src);
}

// ── to_host:: ─────────────────────────────────────────────────────────────
// Build outgoing host messages.
// Pass the result to send_to_host(pack(...)).

namespace to_host {
    SenseDial_LowSide_ToHost protocol_request(uint16_t nonce);
    SenseDial_LowSide_ToHost ack(uint16_t nonce);
    SenseDial_LowSide_ToHost log(const char *text, uint16_t nonce);
    SenseDial_LowSide_ToHost state(const SenseDial_LowSide_FromHost &req,
                                   const LowSideSharedState &snap);
    SenseDial_LowSide_ToHost dial_state(uint16_t nonce,
                                        const LowSideSharedState &snap);
    SenseDial_LowSide_ToHost forwarded_to_host(uint16_t nonce,
                                               const SenseDial_LowSide_FromHighSide &msg);
    SenseDial_LowSide_ToHost firmware_update_status(uint16_t nonce,
                                                    const LowSideSharedState &snap);
}

// ── to_highside:: ─────────────────────────────────────────────────────────
// Build outgoing high-side messages.
// Pass the result to send_to_highside(pack(...)).

namespace to_highside {
    SenseDial_LowSide_ToHighSide protocol_request(uint16_t nonce);
    SenseDial_LowSide_ToHighSide ack(uint16_t nonce);
    SenseDial_LowSide_ToHighSide log(const char *text, uint16_t nonce);
    SenseDial_LowSide_ToHighSide dial_state(uint16_t nonce,
                                            const LowSideSharedState &snap);
    SenseDial_LowSide_ToHighSide low_side_status(uint16_t nonce,
                                                 const LowSideSharedState &snap);
    SenseDial_LowSide_ToHighSide fault(uint16_t nonce,
                                       SenseDial_LowSide_FaultCode code,
                                       SenseDial_LowSide_FaultSeverity severity,
                                       bool active,
                                       const char *detail);
    SenseDial_LowSide_ToHighSide fw_update_status(uint16_t nonce,
                                                  const LowSideSharedState &snap);
}
