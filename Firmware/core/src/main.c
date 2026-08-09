#include <spaghetti/core.h>
#include <zephyr/kernel.h>
#include <zephyr/sys/printk.h>

int main(void)
{
	int err = spaghetti_core_init();

	if (err < 0) {
		printk("Spaghetti Core initialization failed: %d\n", err);
		return err;
	}

	printk("Hello from Spaghetti LAB!\n");

	for (;;) {
		printk("uptime: %lld ms\n", k_uptime_get());
		k_sleep(K_SECONDS(5));
	}

	return 0;
}