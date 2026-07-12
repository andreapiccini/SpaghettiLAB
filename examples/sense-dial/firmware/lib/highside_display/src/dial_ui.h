#pragma once
#include "sensedial_lowside.pb.h"
bool dial_ui_create();
void dial_ui_set_state(const SenseDial_LowSide_DialState&);
void dial_ui_set_status(const SenseDial_LowSide_LowSideStatus&);
void dial_ui_set_connected(bool);
