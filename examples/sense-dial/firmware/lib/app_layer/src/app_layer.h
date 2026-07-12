#pragma once

#include <Arduino.h>

extern "C" {
#include "sensedial_lowside.pb.h"
}

// Control-plane entrypoint for the low-side runtime.
//
// This module owns the receive-side application flow:
// - it polls both links
// - it keeps the shared runtime snapshot in sync with link readiness
// - it dispatches already-authenticated messages to the right handlers
//
// The main loop should treat this as a black box and call it once per iteration.
void app_layer_run();
