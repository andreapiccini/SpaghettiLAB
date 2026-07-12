#pragma once

#include <Arduino.h>

extern "C" {
#include "sensedial_lowside.pb.h"
}


void link_layer_init(Stream &host_stream, Stream &device_stream);
void link_layer_service();

bool link_layer_host_ready();
bool link_layer_highside_ready();

bool send_to_host(const SenseDial_LowSide_ToHost &msg);
bool send_to_highside(const SenseDial_LowSide_ToHighSide &msg);

bool receive_from_host(SenseDial_LowSide_FromHost &msg);
bool receive_from_highside(SenseDial_LowSide_FromHighSide &msg);
bool poll_from_host(SenseDial_LowSide_FromHost &msg);
bool poll_from_highside(SenseDial_LowSide_FromHighSide &msg);

bool send_protocol_request_to_host();
bool send_protocol_request_to_highside();

void link_layer_request_forward_protocol_info();

const char *link_layer_last_error();
