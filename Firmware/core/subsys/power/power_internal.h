#ifndef SPAGHETTI_POWER_INTERNAL_H
#define SPAGHETTI_POWER_INTERNAL_H

#include <stdbool.h>

#include <spaghetti/power.h>

#if defined(CONFIG_SPAGHETTI_POWER_FAKE_BACKEND)
int spaghetti_power_backend_set(spaghetti_power_resource_id_t id, bool enabled);
#endif

#endif /* SPAGHETTI_POWER_INTERNAL_H */
