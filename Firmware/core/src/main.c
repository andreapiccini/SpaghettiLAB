#include <zephyr/kernel.h>
#include <zephyr/sys/printk.h>

int main(void)
{
	printk("Hello from Zephyr on ESP32-C3!\n");

	for (;;) {
		printk("uptime: %lld ms\n", k_uptime_get());
		k_sleep(K_SECONDS(5));
	}

	return 0;
}
