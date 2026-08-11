#ifndef SPAGHETTI_MQTT_INTERNAL_H
#define SPAGHETTI_MQTT_INTERNAL_H

#include <spaghetti/data.h>
#include <spaghetti/mqtt.h>

int spaghetti_mqtt_format_electrical(
	const struct spaghetti_electrical_message *message,
	struct spaghetti_mqtt_publication *out);

#endif /* SPAGHETTI_MQTT_INTERNAL_H */
