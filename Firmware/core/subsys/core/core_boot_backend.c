#include "core_boot_internal.h"

#include <errno.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#include <zephyr/sys/reboot.h>

int spaghetti_core_bootstrap_probe(uint32_t timeout_ms, bool *requested)
{
	if ((timeout_ms == 0U) || (requested == NULL)) {
		return -EINVAL;
	}

	*requested = false;
	return 0;
}

void spaghetti_core_boot_reboot(void)
{
	sys_reboot(SYS_REBOOT_WARM);
}
