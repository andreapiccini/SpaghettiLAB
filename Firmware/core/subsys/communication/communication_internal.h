#ifndef SPAGHETTI_COMMUNICATION_INTERNAL_H
#define SPAGHETTI_COMMUNICATION_INTERNAL_H

#include <spaghetti/communication.h>

int spaghetti_communication_shell_init(void);

int spaghetti_communication_shell_decode_hex(
	const char *hex,
	struct spaghetti_request *request);

#endif /* SPAGHETTI_COMMUNICATION_INTERNAL_H */
