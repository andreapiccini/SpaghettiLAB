#include <errno.h>
#include <stdbool.h>
#include <stdint.h>

#include <zephyr/ztest.h>

#include <relay.h>

#include <spaghetti/module.h>
#include <spaghetti/module_driver.h>
#include <spaghetti/port.h>

struct spaghetti_port {
	spaghetti_port_id_t id;
	uint32_t capabilities;
};

static const struct spaghetti_port fake_output_port = {
	.id = 1U,
	.capabilities = SPAGHETTI_PORT_CAP_DIGITAL_OUTPUT,
};
static bool output_high;
static uint32_t output_write_count;
static int output_error;

int spaghetti_port_set_output(const struct spaghetti_port *port, bool high)
{
	if (port != &fake_output_port) {
		return -ENOTSUP;
	}
	if (output_error < 0) {
		return output_error;
	}

	output_high = high;
	++output_write_count;
	return 0;
}

ZTEST(relay, test_safe_state_polarity_commands_and_errors)
{
	const struct spaghetti_relay_config active_low_safe_off = {
		.active_high = false,
		.safe_on = false,
	};
	const struct spaghetti_relay_config active_high_safe_on = {
		.active_high = true,
		.safe_on = true,
	};
	const struct spaghetti_command relay_on = {
		.type = SPAGHETTI_COMMAND_RELAY_SET,
		.relay_on = true,
	};
	const struct spaghetti_command relay_off = {
		.type = SPAGHETTI_COMMAND_RELAY_SET,
		.relay_on = false,
	};
	struct spaghetti_module_endpoint endpoint;
	struct spaghetti_module module = {
		.port = &fake_output_port,
	};

	zassert_equal(spaghetti_relay_driver.ops->validate_config(
		NULL, sizeof(active_low_safe_off)), -EINVAL);
	zassert_equal(spaghetti_relay_driver.ops->validate_config(
		&active_low_safe_off, sizeof(active_low_safe_off) - 1U), -EINVAL);
	zassert_ok(spaghetti_relay_driver.ops->describe_endpoint(
		&active_low_safe_off, sizeof(active_low_safe_off), &endpoint));
	zassert_equal(endpoint.kind, SPAGHETTI_ENDPOINT_PORT_EXCLUSIVE);
	zassert_equal(endpoint.value, 0U);

	zassert_ok(spaghetti_relay_driver.ops->init(
		&module, &active_low_safe_off, sizeof(active_low_safe_off)));
	zassert_true(output_high);
	zassert_equal(output_write_count, 1U);
	module.state = SPAGHETTI_MODULE_READY;
	zassert_ok(spaghetti_relay_driver.ops->command(&module, &relay_on));
	zassert_false(output_high);
	zassert_ok(spaghetti_relay_driver.ops->command(&module, &relay_off));
	zassert_true(output_high);
	output_error = -EIO;
	zassert_equal(spaghetti_relay_driver.ops->command(&module, &relay_on),
		      -EIO);
	zassert_true(output_high);
	output_error = 0;
	zassert_ok(spaghetti_relay_driver.ops->deinit(&module));
	zassert_true(output_high);
	zassert_is_null(module.context);

	module.state = SPAGHETTI_MODULE_UNINITIALIZED;
	zassert_ok(spaghetti_relay_driver.ops->init(
		&module, &active_high_safe_on, sizeof(active_high_safe_on)));
	zassert_true(output_high);
	module.state = SPAGHETTI_MODULE_READY;
	output_error = -ENODEV;
	zassert_equal(spaghetti_relay_driver.ops->deinit(&module), -ENODEV);
	zassert_is_null(module.context);
	output_error = 0;
}

ZTEST_SUITE(relay, NULL, NULL, NULL, NULL, NULL);
