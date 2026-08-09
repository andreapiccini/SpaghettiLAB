#include <spaghetti/core.h>

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>

LOG_MODULE_REGISTER(
	spaghetti_app,
	CONFIG_SPAGHETTI_APP_LOG_LEVEL
);

int main(void)
{
	int err = spaghetti_core_init();

	if (err < 0) {
		LOG_ERR("Spaghetti Core initialization failed: %d", err);
		return err;
	}

	LOG_INF("Hello from Spaghetti LAB!");

	for (;;) {
		LOG_INF("uptime: %lld ms", k_uptime_get());
		k_sleep(K_SECONDS(5));
	}

	return 0;
}
