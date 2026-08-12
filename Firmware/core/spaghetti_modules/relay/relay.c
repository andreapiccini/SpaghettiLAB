#include <relay.h>

#include <errno.h>
#include <stdbool.h>
#include <string.h>

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>

#include <spaghetti/module.h>
#include <spaghetti/module_driver.h>
#include <spaghetti/port.h>

LOG_MODULE_REGISTER(spaghetti_relay, CONFIG_SPAGHETTI_RELAY_LOG_LEVEL);

struct spaghetti_relay_context {
	struct spaghetti_relay_config config;
	bool logical_on;
	bool initialized;
};

K_MEM_SLAB_DEFINE(relay_context_slab,
		  sizeof(struct spaghetti_relay_context),
		  CONFIG_SPAGHETTI_RELAY_MAX_INSTANCES,
		  __alignof__(struct spaghetti_relay_context));

static int relay_validate_config(const void *config, size_t config_size)
{
	if ((config == NULL) ||
	    (config_size != sizeof(struct spaghetti_relay_config))) {
		return -EINVAL;
	}

	return 0;
}

static int relay_describe_endpoint(const void *config, size_t config_size,
				   struct spaghetti_module_endpoint *out)
{
	int err;

	if (out == NULL) {
		return -EINVAL;
	}

	err = relay_validate_config(config, config_size);
	if (err < 0) {
		return err;
	}

	const struct spaghetti_module_endpoint endpoint = {
		.kind = SPAGHETTI_ENDPOINT_PORT_EXCLUSIVE,
		.value_size = 0U,
	};

	*out = endpoint;
	return 0;
}

static bool relay_electrical_level(
	const struct spaghetti_relay_context *context,
	bool logical_on)
{
	return logical_on == context->config.active_high;
}

static int relay_set_state(struct spaghetti_module *module,
			   struct spaghetti_relay_context *context,
			   bool logical_on)
{
	int err = spaghetti_port_set_output(
		module->port, relay_electrical_level(context, logical_on));

	if (err == 0) {
		context->logical_on = logical_on;
	}

	return err;
}

static void relay_free_context(struct spaghetti_relay_context *context)
{
	memset(context, 0, sizeof(*context));
	k_mem_slab_free(&relay_context_slab, context);
}

static int relay_init(struct spaghetti_module *module, const void *config,
		      size_t config_size)
{
	struct spaghetti_relay_config relay_config;
	struct spaghetti_relay_context *context;
	void *context_block;
	int err;

	if ((module == NULL) || (module->port == NULL) ||
	    (module->context != NULL)) {
		return -EINVAL;
	}

	err = relay_validate_config(config, config_size);
	if (err < 0) {
		return err;
	}
	memcpy(&relay_config, config, sizeof(relay_config));

	err = k_mem_slab_alloc(&relay_context_slab, &context_block, K_NO_WAIT);
	if (err < 0) {
		return -ENOMEM;
	}

	context = context_block;
	memset(context, 0, sizeof(*context));
	context->config = relay_config;
	err = relay_set_state(module, context, relay_config.safe_on);
	if (err < 0) {
		relay_free_context(context);
		return err;
	}

	context->initialized = true;
	module->context = context;
	return 0;
}

static int relay_command(struct spaghetti_module *module,
			 const struct spaghetti_command *command)
{
	struct spaghetti_relay_context *context;

	if ((module == NULL) || (command == NULL) ||
	    (module->state != SPAGHETTI_MODULE_READY) ||
	    (module->context == NULL)) {
		return -EINVAL;
	}
	if (command->type != SPAGHETTI_COMMAND_RELAY_SET) {
		return -ENOTSUP;
	}

	context = module->context;
	if (!context->initialized) {
		return -EINVAL;
	}

	return relay_set_state(module, context, command->relay_on);
}

static int relay_deinit(struct spaghetti_module *module)
{
	struct spaghetti_relay_context *context;
	int err;

	if ((module == NULL) || (module->context == NULL)) {
		return -EINVAL;
	}

	context = module->context;
	if (!context->initialized) {
		return -EINVAL;
	}

	err = relay_set_state(module, context, context->config.safe_on);
	context->initialized = false;
	relay_free_context(context);
	module->context = NULL;
	module->state = SPAGHETTI_MODULE_UNINITIALIZED;
	return err;
}

static const struct spaghetti_module_driver_ops relay_ops = {
	.validate_config = relay_validate_config,
	.describe_endpoint = relay_describe_endpoint,
	.init = relay_init,
	.read = NULL,
	.command = relay_command,
	.deinit = relay_deinit,
};

const struct spaghetti_module_driver spaghetti_relay_driver = {
	.type_id = "relay",
	.required_capabilities = SPAGHETTI_PORT_CAP_DIGITAL_OUTPUT,
	.ops = &relay_ops,
};
