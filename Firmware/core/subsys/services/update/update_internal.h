#ifndef SPAGHETTI_UPDATE_INTERNAL_H
#define SPAGHETTI_UPDATE_INTERNAL_H

#include <stdbool.h>
#include <stdint.h>

int spaghetti_update_backend_is_trial(bool *trial);
int spaghetti_update_backend_active_slot(uint8_t *slot);
int spaghetti_update_backend_prepare(void);
int spaghetti_update_backend_finalize_test(void);
int spaghetti_update_backend_cancel(void);
int spaghetti_update_backend_confirm(void);

#endif /* SPAGHETTI_UPDATE_INTERNAL_H */
