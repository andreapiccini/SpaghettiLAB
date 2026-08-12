#ifndef SPAGHETTI_MQTT_INTERNAL_H
#define SPAGHETTI_MQTT_INTERNAL_H

#include <spaghetti/data.h>
#include <spaghetti/mqtt.h>
#include <spaghetti/schema.h>

int spaghetti_mqtt_format_record(
	const struct spaghetti_record *record,
	struct spaghetti_mqtt_publication *out);

#endif /* SPAGHETTI_MQTT_INTERNAL_H */
