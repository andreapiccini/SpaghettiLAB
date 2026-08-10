#include <spaghetti/core.h>
#include <spaghetti/port.h>
#include <ina219.h>

#include <errno.h>

#include <zephyr/drivers/sensor.h>
#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>

LOG_MODULE_REGISTER(
	spaghetti_app,
	CONFIG_SPAGHETTI_APP_LOG_LEVEL
);

int main(void)
{
	k_sleep(K_SECONDS(5));
	LOG_INF("Spaghetti LAB boot");

	int err = spaghetti_core_init();

	if (err < 0) {
		LOG_ERR("Spaghetti Core initialization failed: %d", err);
		return err;
	}

	return 0;
}
