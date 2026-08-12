#include <errno.h>
#include <stdbool.h>
#include <stdint.h>
#include <string.h>

#include <zephyr/sys/util.h>
#include <zephyr/ztest.h>

#include <spaghetti/driver_registry.h>
#include <spaghetti/module_driver.h>
#include <spaghetti/module_manager.h>
#include <spaghetti/port.h>

struct spaghetti_port {
	spaghetti_port_id_t id;
	uint32_t capabilities;
};

struct fake_driver_config {
	uint8_t i2c_address;
	int init_error;
};

struct fake_driver_context {
	bool used;
	uint8_t i2c_address;
	bool output_on;
};

static const struct spaghetti_port fake_port = {
	.id = 0U,
	.capabilities = SPAGHETTI_PORT_CAP_I2C,
};

static struct fake_driver_context fake_contexts[CONFIG_SPAGHETTI_MAX_MODULES];

static int fake_validate_config(const void *config, size_t config_size)
{
	const struct fake_driver_config *fake_config = config;

	if ((fake_config == NULL) || (config_size != sizeof(*fake_config)) ||
	    (fake_config->i2c_address > 0x7FU)) {
		return -EINVAL;
	}

	return 0;
}

static int fake_describe_endpoint(const void *config, size_t config_size,
				  struct spaghetti_module_endpoint *out)
{
	const struct fake_driver_config *fake_config = config;
	int err;

	if (out == NULL) {
		return -EINVAL;
	}

	err = fake_validate_config(config, config_size);
	if (err < 0) {
		return err;
	}

	const struct spaghetti_module_endpoint endpoint = {
		.kind = SPAGHETTI_ENDPOINT_I2C_ADDRESS,
		.value = fake_config->i2c_address,
	};

	*out = endpoint;
	return 0;
}

static int fake_describe_exclusive_endpoint(
	const void *config,
	size_t config_size,
	struct spaghetti_module_endpoint *out)
{
	int err;

	if (out == NULL) {
		return -EINVAL;
	}

	err = fake_validate_config(config, config_size);
	if (err < 0) {
		return err;
	}

	*out = (struct spaghetti_module_endpoint) {
		.kind = SPAGHETTI_ENDPOINT_PORT_EXCLUSIVE,
		.value = 0U,
	};
	return 0;
}

static int fake_init(struct spaghetti_module *module, const void *config,
		     size_t config_size)
{
	const struct fake_driver_config *fake_config = config;
	int err = fake_validate_config(config, config_size);

	if ((err < 0) || (module == NULL) || (module->context != NULL)) {
		return (err < 0) ? err : -EINVAL;
	}

	if (fake_config->init_error < 0) {
		return fake_config->init_error;
	}

	for (size_t context_idx = 0U; context_idx < ARRAY_SIZE(fake_contexts);
	     ++context_idx) {
		if (!fake_contexts[context_idx].used) {
			fake_contexts[context_idx].used = true;
			fake_contexts[context_idx].i2c_address = fake_config->i2c_address;
			module->context = &fake_contexts[context_idx];
			return 0;
		}
	}

	return -ENOMEM;
}

static int fake_read(struct spaghetti_module *module, struct spaghetti_sample *out)
{
	const struct fake_driver_context *context;
	struct spaghetti_sample sample;

	if ((module == NULL) || (out == NULL) || (module->context == NULL)) {
		return -EINVAL;
	}

	context = module->context;
	sample.bus_voltage_microvolts = (int32_t)context->i2c_address * 1000;
	sample.current_microamps = (int32_t)context->i2c_address * 10;
	sample.power_microwatts = context->i2c_address;
	*out = sample;
	return 0;
}

static int fake_command(struct spaghetti_module *module,
			const struct spaghetti_command *command)
{
	struct fake_driver_context *context;

	if ((module == NULL) || (command == NULL) ||
	    (module->context == NULL)) {
		return -EINVAL;
	}
	if (command->type != SPAGHETTI_COMMAND_RELAY_SET) {
		return -ENOTSUP;
	}

	context = module->context;
	context->output_on = command->relay_on;
	return 0;
}

static int fake_deinit(struct spaghetti_module *module)
{
	struct fake_driver_context *context;

	if ((module == NULL) || (module->context == NULL)) {
		return -EINVAL;
	}

	context = module->context;
	memset(context, 0, sizeof(*context));
	module->context = NULL;
	return 0;
}

static const struct spaghetti_module_driver_ops fake_ops = {
	.validate_config = fake_validate_config,
	.describe_endpoint = fake_describe_endpoint,
	.init = fake_init,
	.read = fake_read,
	.command = fake_command,
	.deinit = fake_deinit,
};

static const struct spaghetti_module_driver fake_driver = {
	.type_id = "fake",
	.required_capabilities = SPAGHETTI_PORT_CAP_I2C,
	.ops = &fake_ops,
};

static const struct spaghetti_module_driver_ops fake_exclusive_ops = {
	.validate_config = fake_validate_config,
	.describe_endpoint = fake_describe_exclusive_endpoint,
	.init = fake_init,
	.read = fake_read,
	.command = fake_command,
	.deinit = fake_deinit,
};

static const struct spaghetti_module_driver fake_exclusive_driver = {
	.type_id = "fake-exclusive",
	.required_capabilities = SPAGHETTI_PORT_CAP_I2C,
	.ops = &fake_exclusive_ops,
};

const struct spaghetti_port *spaghetti_port_get(spaghetti_port_id_t id)
{
	return (id == fake_port.id) ? &fake_port : NULL;
}

bool spaghetti_port_has_capability(const struct spaghetti_port *port,
				    uint32_t capabilities)
{
	return (port != NULL) && (capabilities != 0U) &&
	       ((port->capabilities & capabilities) == capabilities);
}

const struct spaghetti_module_driver *spaghetti_driver_registry_find(
	const char *type_id)
{
	if ((type_id != NULL) && (strcmp(type_id, fake_driver.type_id) == 0)) {
		return &fake_driver;
	}
	if ((type_id != NULL) &&
	    (strcmp(type_id, fake_exclusive_driver.type_id) == 0)) {
		return &fake_exclusive_driver;
	}

	return NULL;
}

static int configure_fake(spaghetti_module_key_t key, uint8_t i2c_address,
			  int init_error, spaghetti_module_id_t *out_id)
{
	const struct fake_driver_config config = {
		.i2c_address = i2c_address,
		.init_error = init_error,
	};
	const struct spaghetti_module_request request = {
		.key = key,
		.port_id = 0U,
		.type_id = "fake",
		.driver_config = &config,
		.driver_config_size = sizeof(config),
		.revision = 1U,
	};

	return spaghetti_module_manager_configure(&request, out_id);
}

static int configure_fake_exclusive(spaghetti_module_key_t key,
				    spaghetti_module_id_t *out_id)
{
	const struct fake_driver_config config = {
		.i2c_address = 0U,
	};
	const struct spaghetti_module_request request = {
		.key = key,
		.port_id = 0U,
		.type_id = "fake-exclusive",
		.driver_config = &config,
		.driver_config_size = sizeof(config),
		.revision = 1U,
	};

	return spaghetti_module_manager_configure(&request, out_id);
}

ZTEST(module_manager, test_shared_port_lifecycle)
{
	struct spaghetti_module_snapshot snapshots[CONFIG_SPAGHETTI_MAX_MODULES];
	struct spaghetti_module_snapshot snapshot;
	struct spaghetti_sample sample;
	const struct spaghetti_command relay_on = {
		.type = SPAGHETTI_COMMAND_RELAY_SET,
		.relay_on = true,
	};
	spaghetti_module_id_t id_10;
	spaghetti_module_id_t id_11;
	spaghetti_module_id_t id_12;
	spaghetti_module_id_t id_13;
	spaghetti_module_id_t filler_ids[CONFIG_SPAGHETTI_MAX_MODULES];
	spaghetti_module_id_t ignored_id = UINT8_MAX;
	size_t filler_count = 0U;
	size_t module_count;
	int err;

	zassert_ok(spaghetti_module_manager_init());
	zassert_ok(configure_fake(10U, 0x40U, 0, &id_10));
	zassert_ok(configure_fake(11U, 0x41U, 0, &id_11));
	zassert_ok(configure_fake(12U, 0x44U, 0, &id_12));

	zassert_ok(spaghetti_module_manager_list_by_port(0U, NULL, 0U, &module_count));
	zassert_equal(module_count, 3U);
	zassert_ok(spaghetti_module_manager_list_by_port(
		0U, snapshots, ARRAY_SIZE(snapshots), &module_count));
	zassert_equal(module_count, 3U);
	zassert_equal(snapshots[0].key, 10U);
	zassert_equal(snapshots[1].key, 11U);
	zassert_equal(snapshots[2].key, 12U);
	zassert_ok(spaghetti_module_manager_get_by_id(id_11, &snapshot));
	zassert_equal(snapshot.key, 11U);
	zassert_equal(snapshot.endpoint.value, 0x41U);

	snapshot.key = 99U;
	err = spaghetti_module_manager_list_by_port(0U, &snapshot, 1U, &module_count);
	zassert_equal(err, -ENOSPC);
	zassert_equal(module_count, 3U);
	zassert_equal(snapshot.key, 99U);

	zassert_equal(configure_fake(10U, 0x42U, 0, &ignored_id), -EEXIST);
	zassert_equal(configure_fake(13U, 0x40U, 0, &ignored_id), -EADDRINUSE);
	zassert_equal(configure_fake_exclusive(20U, &ignored_id), -EADDRINUSE);
	zassert_equal(configure_fake(13U, 0x42U, -EIO, &ignored_id), -EIO);
	zassert_equal(spaghetti_module_manager_get_by_key(13U, &snapshot), -ENOENT);

	zassert_ok(configure_fake(13U, 0x42U, 0, &id_13));
	for (size_t slot_idx = 4U; slot_idx < CONFIG_SPAGHETTI_MAX_MODULES; slot_idx++) {
		zassert_ok(configure_fake((uint16_t)(10U + slot_idx),
			(uint8_t)(0x50U + slot_idx), 0, &filler_ids[filler_count]));
		filler_count++;
	}
	zassert_equal(configure_fake(100U, 0x70U, 0, &ignored_id), -ENOSPC);
	for (size_t filler_idx = 0U; filler_idx < filler_count; filler_idx++) {
		zassert_ok(spaghetti_module_manager_remove(filler_ids[filler_idx], 1U));
	}

	zassert_ok(spaghetti_module_manager_read(id_10, &sample));
	zassert_equal(sample.bus_voltage_microvolts, 0x40 * 1000);
	zassert_equal(spaghetti_module_manager_command(id_10, NULL), -EINVAL);
	zassert_ok(spaghetti_module_manager_command(id_10, &relay_on));
	zassert_true(fake_contexts[id_10].output_on);
	zassert_equal(spaghetti_module_manager_remove(id_10, 2U), -ESTALE);
	zassert_ok(spaghetti_module_manager_remove(id_11, 1U));
	zassert_equal(spaghetti_module_manager_get_by_key(11U, &snapshot), -ENOENT);
	zassert_equal(spaghetti_module_manager_read(id_11, &sample), -ENOENT);
	zassert_ok(spaghetti_module_manager_get_by_key(10U, &snapshot));
	zassert_equal(snapshot.state, SPAGHETTI_MODULE_READY);
	zassert_ok(spaghetti_module_manager_get_by_key(12U, &snapshot));
	zassert_equal(snapshot.state, SPAGHETTI_MODULE_READY);

	zassert_ok(spaghetti_module_manager_list_by_port(0U, NULL, 0U, &module_count));
	zassert_equal(module_count, 3U);
	zassert_ok(spaghetti_module_manager_remove(id_10, 1U));
	zassert_ok(spaghetti_module_manager_remove(id_12, 1U));
	zassert_ok(spaghetti_module_manager_remove(id_13, 1U));

	zassert_ok(configure_fake_exclusive(20U, &id_10));
	zassert_equal(configure_fake(21U, 0x40U, 0, &ignored_id), -EADDRINUSE);
	zassert_ok(spaghetti_module_manager_remove(id_10, 1U));
}

ZTEST_SUITE(module_manager, NULL, NULL, NULL, NULL, NULL);
