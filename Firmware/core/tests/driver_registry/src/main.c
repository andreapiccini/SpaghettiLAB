#include <errno.h>
#include <stddef.h>
#include <string.h>

#include <zephyr/ztest.h>

#include <ina219.h>
#include <relay.h>

#include <spaghetti/driver_registry.h>
#include <spaghetti/module_driver.h>
#include <spaghetti/port.h>

#include "driver_registry_internal.h"

static int fake_validate(const void *config, size_t config_size)
{
	return ((config != NULL) && (config_size == 1U)) ? 0 : -EINVAL;
}

static int fake_describe(const void *config, size_t config_size,
			 struct spaghetti_module_endpoint *out)
{
	if ((fake_validate(config, config_size) < 0) || (out == NULL)) {
		return -EINVAL;
	}

	*out = (struct spaghetti_module_endpoint) {
		.kind = SPAGHETTI_ENDPOINT_I2C_ADDRESS,
		.value_size = 1U,
		.value = {*(const uint8_t *)config},
	};
	return 0;
}

static int fake_init(struct spaghetti_module *module, const void *config,
		     size_t config_size)
{
	ARG_UNUSED(config);
	ARG_UNUSED(config_size);
	return (module != NULL) ? 0 : -EINVAL;
}

static int fake_read(struct spaghetti_module *module,
		     struct spaghetti_sample *out)
{
	return ((module != NULL) && (out != NULL)) ? 0 : -EINVAL;
}

static int fake_deinit(struct spaghetti_module *module)
{
	return (module != NULL) ? 0 : -EINVAL;
}

static const struct spaghetti_module_driver_ops complete_ops = {
	.validate_config = fake_validate,
	.describe_endpoint = fake_describe,
	.init = fake_init,
	.read = fake_read,
	.deinit = fake_deinit,
};

const struct spaghetti_module_driver spaghetti_ina219_driver = {
	.type_id = "ina219",
	.required_capabilities = SPAGHETTI_PORT_CAP_I2C,
	.ops = &complete_ops,
};

const struct spaghetti_module_driver spaghetti_relay_driver = {
	.type_id = "relay",
	.required_capabilities = SPAGHETTI_PORT_CAP_DIGITAL_OUTPUT,
	.ops = &complete_ops,
};

ZTEST(driver_registry, test_catalog_lookup_and_invalid_descriptors)
{
	const struct spaghetti_module_driver duplicate = {
		.type_id = "ina219",
		.required_capabilities = SPAGHETTI_PORT_CAP_I2C,
		.ops = &complete_ops,
	};
	const struct spaghetti_module_driver incomplete = {
		.type_id = "incomplete",
		.required_capabilities = SPAGHETTI_PORT_CAP_I2C,
	};
	const struct spaghetti_module_driver *valid_entries[] = {
		&spaghetti_ina219_driver,
		&spaghetti_relay_driver,
	};
	const struct spaghetti_module_driver *duplicate_entries[] = {
		&spaghetti_ina219_driver,
		&duplicate,
	};
	const struct spaghetti_module_driver *incomplete_entries[] = {
		&incomplete,
	};
	const struct spaghetti_module_driver *null_entries[] = {
		NULL,
	};
	const struct spaghetti_module_driver *first_lookup;

	zassert_equal(spaghetti_driver_registry_validate(NULL, 0U), -EINVAL);
	zassert_equal(spaghetti_driver_registry_validate(null_entries, 1U), -EINVAL);
	zassert_equal(spaghetti_driver_registry_validate(incomplete_entries, 1U),
		      -EINVAL);
	zassert_equal(spaghetti_driver_registry_validate(duplicate_entries, 2U),
		      -EINVAL);
	zassert_ok(spaghetti_driver_registry_validate(valid_entries, 2U));
	zassert_ok(spaghetti_driver_registry_init());
	zassert_equal(spaghetti_driver_registry_count(), 2U);

	first_lookup = spaghetti_driver_registry_find("ina219");
	zassert_equal_ptr(first_lookup, &spaghetti_ina219_driver);
	zassert_equal_ptr(spaghetti_driver_registry_find("ina219"), first_lookup);
	zassert_equal_ptr(spaghetti_driver_registry_find("relay"),
			  &spaghetti_relay_driver);
	zassert_is_null(spaghetti_driver_registry_find(NULL));
	zassert_is_null(spaghetti_driver_registry_find(""));
	zassert_is_null(spaghetti_driver_registry_find("unknown"));
	zassert_equal_ptr(spaghetti_driver_registry_get(0U),
			  &spaghetti_ina219_driver);
	zassert_is_null(spaghetti_driver_registry_get(2U));
}

ZTEST_SUITE(driver_registry, NULL, NULL, NULL, NULL, NULL);
