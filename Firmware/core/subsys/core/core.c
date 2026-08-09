#include <spaghetti/core.h>
#include <zephyr/logging/log.h>

LOG_MODULE_REGISTER(spaghetti_core, LOG_LEVEL_INF);

static enum spaghetti_core_state core_state = SPAGHETTI_CORE_UNINITIALIZED;

int spaghetti_core_init(void)
{
	core_state = SPAGHETTI_CORE_READY;

	LOG_INF("Spaghetti Core ready");

	return 0;
}

enum spaghetti_core_state spaghetti_core_get_state(void)
{
	return core_state;
}
