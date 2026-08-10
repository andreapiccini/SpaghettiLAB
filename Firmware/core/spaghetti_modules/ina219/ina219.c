#include <ina219.h>

#include <errno.h>
#include <stdbool.h>
#include <stdint.h>
#include <string.h>

#include <zephyr/device.h>
#include <zephyr/drivers/i2c.h>
#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zephyr/sys/byteorder.h>
#include <zephyr/sys/util.h>

#include <spaghetti/module.h>
#include <spaghetti/module_driver.h>
#include <spaghetti/port.h>

LOG_MODULE_REGISTER(spaghetti_ina219, CONFIG_SPAGHETTI_INA219_LOG_LEVEL);

#define SPAGHETTI_INA219_REG_CONFIG 0x00U
#define SPAGHETTI_INA219_REG_BUS_VOLTAGE 0x02U
#define SPAGHETTI_INA219_REG_POWER 0x03U
#define SPAGHETTI_INA219_REG_CURRENT 0x04U
#define SPAGHETTI_INA219_REG_CALIBRATION 0x05U

#define SPAGHETTI_INA219_CONFIG_RESET 0x8000U
#define SPAGHETTI_INA219_CONFIG_TRIGGERED 0x399BU
#define SPAGHETTI_INA219_BUS_CNVR BIT(1)
#define SPAGHETTI_INA219_BUS_OVF BIT(0)

#define SPAGHETTI_INA219_ADDRESS_MIN 0x40U
#define SPAGHETTI_INA219_ADDRESS_MAX 0x4FU
#define SPAGHETTI_INA219_CALIBRATION_NUMERATOR 40960000ULL
#define SPAGHETTI_INA219_BUS_VOLTAGE_LSB_UV 4000ULL
#define SPAGHETTI_INA219_POWER_LSB_MULTIPLIER 20ULL
#define SPAGHETTI_INA219_CONVERSION_ATTEMPTS 10U

struct spaghetti_ina219_context {
	const struct device *i2c;
	struct spaghetti_ina219_config config;
	uint16_t calibration;
	bool initialized;
};

K_MEM_SLAB_DEFINE(ina219_context_slab,
		  sizeof(struct spaghetti_ina219_context),
		  CONFIG_SPAGHETTI_INA219_MAX_INSTANCES,
		  __alignof__(struct spaghetti_ina219_context));

static int ina219_write_register(const struct spaghetti_ina219_context *context,
				 uint8_t reg, uint16_t value)
{
	uint8_t buffer[3] = {reg, 0U, 0U};

	sys_put_be16(value, &buffer[1]);
	return i2c_write(context->i2c, buffer, sizeof(buffer),
			 context->config.i2c_address);
}

static int ina219_read_register(const struct spaghetti_ina219_context *context,
				uint8_t reg, uint16_t *out)
{
	uint8_t buffer[2];
	int err;

	if (out == NULL) {
		return -EINVAL;
	}

	err = i2c_write_read(context->i2c, context->config.i2c_address, &reg,
			     sizeof(reg), buffer, sizeof(buffer));
	if (err < 0) {
		return err;
	}

	*out = sys_get_be16(buffer);
	return 0;
}

static int ina219_validate_config(const void *config, size_t config_size)
{
	struct spaghetti_ina219_config ina219_config;

	if ((config == NULL) ||
	    (config_size != sizeof(struct spaghetti_ina219_config))) {
		return -EINVAL;
	}

	memcpy(&ina219_config, config, sizeof(ina219_config));
	if ((ina219_config.i2c_address < SPAGHETTI_INA219_ADDRESS_MIN) ||
	    (ina219_config.i2c_address > SPAGHETTI_INA219_ADDRESS_MAX) ||
	    (ina219_config.shunt_milliohm == 0U) ||
	    (ina219_config.current_lsb_microamp == 0U)) {
		return -EINVAL;
	}

	return 0;
}

static int ina219_describe_endpoint(const void *config, size_t config_size,
				    struct spaghetti_module_endpoint *out)
{
	struct spaghetti_ina219_config ina219_config;
	int err;

	if (out == NULL) {
		return -EINVAL;
	}

	err = ina219_validate_config(config, config_size);
	if (err < 0) {
		return err;
	}
	memcpy(&ina219_config, config, sizeof(ina219_config));

	const struct spaghetti_module_endpoint endpoint = {
		.kind = SPAGHETTI_ENDPOINT_I2C_ADDRESS,
		.value = ina219_config.i2c_address,
	};

	*out = endpoint;
	return 0;
}

static void ina219_free_context(struct spaghetti_ina219_context *context)
{
	memset(context, 0, sizeof(*context));
	k_mem_slab_free(&ina219_context_slab, context);
}

static int ina219_init(struct spaghetti_module *module, const void *config,
		       size_t config_size)
{
	struct spaghetti_ina219_config ina219_config;
	struct spaghetti_ina219_context *context;
	const struct device *i2c;
	void *context_block;
	uint64_t denominator;
	uint64_t calibration;
	int err;

	if ((module == NULL) || (module->port == NULL) || (module->context != NULL)) {
		return -EINVAL;
	}

	err = ina219_validate_config(config, config_size);
	if (err < 0) {
		return err;
	}
	memcpy(&ina219_config, config, sizeof(ina219_config));

	err = k_mem_slab_alloc(&ina219_context_slab, &context_block, K_NO_WAIT);
	if (err < 0) {
		return -ENOMEM;
	}

	context = context_block;
	memset(context, 0, sizeof(*context));
	i2c = spaghetti_port_i2c_device(module->port);
	if (i2c == NULL) {
		err = -ENOTSUP;
		goto free_context;
	}

	if (!device_is_ready(i2c)) {
		err = -ENODEV;
		goto free_context;
	}

	denominator = (uint64_t)ina219_config.shunt_milliohm *
		      (uint64_t)ina219_config.current_lsb_microamp;
	calibration = SPAGHETTI_INA219_CALIBRATION_NUMERATOR / denominator;
	if ((calibration == 0U) || (calibration > UINT16_MAX)) {
		err = -ERANGE;
		goto free_context;
	}

	context->i2c = i2c;
	context->config = ina219_config;
	context->calibration = (uint16_t)calibration;

	err = ina219_write_register(context, SPAGHETTI_INA219_REG_CONFIG,
				    SPAGHETTI_INA219_CONFIG_RESET);
	if (err < 0) {
		goto free_context;
	}

	k_sleep(K_MSEC(1));
	err = ina219_write_register(context, SPAGHETTI_INA219_REG_CONFIG,
				    SPAGHETTI_INA219_CONFIG_TRIGGERED);
	if (err < 0) {
		goto free_context;
	}

	err = ina219_write_register(context, SPAGHETTI_INA219_REG_CALIBRATION,
				    context->calibration);
	if (err < 0) {
		goto free_context;
	}

	context->initialized = true;
	module->context = context;
	return 0;

free_context:
	ina219_free_context(context);
	return err;
}

static int ina219_read(struct spaghetti_module *module,
		       struct spaghetti_sample *out)
{
	struct spaghetti_ina219_context *context;
	struct spaghetti_sample sample;
	uint16_t bus_raw = 0U;
	uint16_t current_raw;
	uint16_t power_raw;
	bool is_conversion_ready = false;
	int64_t current_ua;
	uint64_t bus_uv;
	uint64_t power_uw;
	int err;

	if ((module == NULL) || (out == NULL) ||
	    (module->state != SPAGHETTI_MODULE_READY) || (module->context == NULL)) {
		return -EINVAL;
	}

	context = module->context;
	if (!context->initialized) {
		return -EINVAL;
	}

	err = ina219_write_register(context, SPAGHETTI_INA219_REG_CONFIG,
				    SPAGHETTI_INA219_CONFIG_TRIGGERED);
	if (err < 0) {
		return err;
	}

	k_sleep(K_MSEC(2));
	for (size_t attempt_idx = 0U;
	     attempt_idx < SPAGHETTI_INA219_CONVERSION_ATTEMPTS;
	     ++attempt_idx) {
		err = ina219_read_register(context, SPAGHETTI_INA219_REG_BUS_VOLTAGE,
					  &bus_raw);
		if (err < 0) {
			return err;
		}

		if ((bus_raw & SPAGHETTI_INA219_BUS_CNVR) != 0U) {
			is_conversion_ready = true;
			break;
		}

		k_sleep(K_MSEC(1));
	}

	if (!is_conversion_ready) {
		return -ETIMEDOUT;
	}

	if ((bus_raw & SPAGHETTI_INA219_BUS_OVF) != 0U) {
		return -ERANGE;
	}

	err = ina219_read_register(context, SPAGHETTI_INA219_REG_CURRENT, &current_raw);
	if (err < 0) {
		return err;
	}

	err = ina219_read_register(context, SPAGHETTI_INA219_REG_POWER, &power_raw);
	if (err < 0) {
		return err;
	}

	bus_uv = (uint64_t)(bus_raw >> 3U) * SPAGHETTI_INA219_BUS_VOLTAGE_LSB_UV;
	current_ua = (int64_t)(int16_t)current_raw *
		     (int64_t)context->config.current_lsb_microamp;
	power_uw = (uint64_t)power_raw *
		   (uint64_t)context->config.current_lsb_microamp *
		   SPAGHETTI_INA219_POWER_LSB_MULTIPLIER;

	if ((bus_uv > INT32_MAX) || (current_ua < INT32_MIN) ||
	    (current_ua > INT32_MAX) || (power_uw > UINT32_MAX)) {
		return -ERANGE;
	}

	sample.bus_voltage_microvolts = (int32_t)bus_uv;
	sample.current_microamps = (int32_t)current_ua;
	sample.power_microwatts = (uint32_t)power_uw;
	*out = sample;
	return 0;
}

static int ina219_deinit(struct spaghetti_module *module)
{
	struct spaghetti_ina219_context *context;
	int err;

	if ((module == NULL) || (module->context == NULL)) {
		return -EINVAL;
	}

	context = module->context;
	if (!context->initialized) {
		return -EINVAL;
	}

	err = ina219_write_register(context, SPAGHETTI_INA219_REG_CONFIG, 0x0000U);
	context->initialized = false;
	ina219_free_context(context);
	module->context = NULL;
	module->state = SPAGHETTI_MODULE_UNINITIALIZED;
	return err;
}

static const struct spaghetti_module_driver_ops ina219_ops = {
	.validate_config = ina219_validate_config,
	.describe_endpoint = ina219_describe_endpoint,
	.init = ina219_init,
	.read = ina219_read,
	.deinit = ina219_deinit,
};

const struct spaghetti_module_driver spaghetti_ina219_driver = {
	.type_id = "ina219",
	.required_capabilities = SPAGHETTI_PORT_CAP_I2C,
	.ops = &ina219_ops,
};
