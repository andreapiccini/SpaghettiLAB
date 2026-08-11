#ifndef SPAGHETTI_CORE_BOOT_INTERNAL_H
#define SPAGHETTI_CORE_BOOT_INTERNAL_H

#include <stdbool.h>
#include <stdint.h>

int spaghetti_core_bootstrap_probe(uint32_t timeout_ms, bool *requested);
void spaghetti_core_boot_reboot(void);

#endif /* SPAGHETTI_CORE_BOOT_INTERNAL_H */
