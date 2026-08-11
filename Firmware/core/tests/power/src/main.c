#include <errno.h>
#include <stdbool.h>
#include <stdint.h>

#include <zephyr/ztest.h>

#include <spaghetti/power.h>

static bool backend_enabled;
static int backend_enable_calls;
static int backend_disable_calls;
static int next_enable_error;
static int next_disable_error;

int spaghetti_power_backend_set(spaghetti_power_resource_id_t id, bool enabled)
{
	int err;

	if (id != 0U) {
		return -ENOENT;
	}

	if (enabled) {
		++backend_enable_calls;
		err = next_enable_error;
		next_enable_error = 0;
	} else {
		++backend_disable_calls;
		err = next_disable_error;
		next_disable_error = 0;
	}
	if (err < 0) {
		return err;
	}

	backend_enabled = enabled;
	return 0;
}

static void expect_status(enum spaghetti_power_state state,
			  uint16_t reference_count,
			  int last_error)
{
	struct spaghetti_power_status status;

	zassert_ok(spaghetti_power_get_status(0U, &status));
	zassert_equal(status.state, state);
	zassert_equal(status.reference_count, reference_count);
	zassert_equal(status.last_error, last_error);
}

ZTEST(power, test_reference_counting_and_transition_rollback)
{
	struct spaghetti_power_status status;
	const spaghetti_power_owner_id_t module_a = 10U;
	const spaghetti_power_owner_id_t module_b = 11U;

	zassert_equal(spaghetti_power_acquire(0U, module_a), -EACCES);
	zassert_equal(spaghetti_power_release(0U, module_a), -EACCES);
	zassert_equal(spaghetti_power_get_status(0U, &status), -EACCES);

	next_disable_error = -EIO;
	zassert_equal(spaghetti_power_init(), -EIO);
	zassert_equal(spaghetti_power_get_status(0U, &status), -EACCES);
	zassert_ok(spaghetti_power_init());
	zassert_equal(spaghetti_power_init(), -EALREADY);
	zassert_false(backend_enabled);
	expect_status(SPAGHETTI_POWER_OFF, 0U, 0);

	zassert_equal(spaghetti_power_get_status(0U, NULL), -EINVAL);
	zassert_equal(spaghetti_power_get_status(1U, &status), -ENOENT);
	zassert_equal(spaghetti_power_acquire(
		0U, SPAGHETTI_POWER_OWNER_INVALID), -EINVAL);
	zassert_equal(spaghetti_power_release(
		0U, SPAGHETTI_POWER_OWNER_INVALID), -EINVAL);
	zassert_equal(spaghetti_power_acquire(1U, module_a), -ENOENT);
	zassert_equal(spaghetti_power_release(1U, module_a), -ENOENT);
	zassert_equal(spaghetti_power_release(0U, module_a), -EALREADY);

	backend_enable_calls = 0;
	backend_disable_calls = 0;
	next_enable_error = -EIO;
	zassert_equal(spaghetti_power_acquire(0U, module_a), -EIO);
	zassert_false(backend_enabled);
	expect_status(SPAGHETTI_POWER_ERROR, 0U, -EIO);

	zassert_ok(spaghetti_power_acquire(0U, module_a));
	zassert_true(backend_enabled);
	expect_status(SPAGHETTI_POWER_ON, 1U, 0);
	zassert_equal(spaghetti_power_acquire(0U, module_a), -EALREADY);
	zassert_ok(spaghetti_power_acquire(0U, module_b));
	zassert_equal(backend_enable_calls, 2);
	expect_status(SPAGHETTI_POWER_ON, 2U, 0);

	zassert_equal(spaghetti_power_release(0U, 12U), -ENOENT);
	zassert_ok(spaghetti_power_release(0U, module_a));
	zassert_true(backend_enabled);
	zassert_equal(backend_disable_calls, 0);
	expect_status(SPAGHETTI_POWER_ON, 1U, 0);

	next_disable_error = -EIO;
	zassert_equal(spaghetti_power_release(0U, module_b), -EIO);
	zassert_true(backend_enabled);
	expect_status(SPAGHETTI_POWER_ERROR, 1U, -EIO);
	zassert_equal(spaghetti_power_acquire(0U, 12U), -EIO);
	zassert_ok(spaghetti_power_release(0U, module_b));
	zassert_false(backend_enabled);
	expect_status(SPAGHETTI_POWER_OFF, 0U, 0);

	backend_enable_calls = 0;
	backend_disable_calls = 0;
	zassert_ok(spaghetti_power_acquire(0U, module_a));
	zassert_ok(spaghetti_power_acquire(0U, module_b));
	zassert_ok(spaghetti_power_release(0U, module_b));
	zassert_true(backend_enabled);
	zassert_ok(spaghetti_power_release(0U, module_a));
	zassert_equal(backend_enable_calls, 1);
	zassert_equal(backend_disable_calls, 1);
	zassert_false(backend_enabled);
	expect_status(SPAGHETTI_POWER_OFF, 0U, 0);

	backend_enable_calls = 0;
	backend_disable_calls = 0;
	for (spaghetti_power_owner_id_t owner = 0U; owner < 8U; ++owner) {
		zassert_ok(spaghetti_power_acquire(0U, owner));
	}
	zassert_equal(spaghetti_power_acquire(0U, 8U), -ENOSPC);
	zassert_equal(backend_enable_calls, 1);
	expect_status(SPAGHETTI_POWER_ON, 8U, 0);

	for (spaghetti_power_owner_id_t owner = 0U; owner < 8U; ++owner) {
		zassert_ok(spaghetti_power_release(0U, owner));
	}
	zassert_equal(backend_disable_calls, 1);
	zassert_false(backend_enabled);
	expect_status(SPAGHETTI_POWER_OFF, 0U, 0);
}

ZTEST_SUITE(power, NULL, NULL, NULL, NULL, NULL);
