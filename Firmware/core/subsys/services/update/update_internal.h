#ifndef SPAGHETTI_UPDATE_INTERNAL_H
#define SPAGHETTI_UPDATE_INTERNAL_H

#include <stdbool.h>

int spaghetti_update_backend_is_trial(bool *trial);
int spaghetti_update_backend_prepare(void);
int spaghetti_update_backend_finalize_test(void);
int spaghetti_update_backend_cancel(void);

#endif /* SPAGHETTI_UPDATE_INTERNAL_H */
