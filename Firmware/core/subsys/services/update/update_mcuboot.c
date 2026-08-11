#include "update_internal.h"

#include <errno.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#include <zephyr/dfu/flash_img.h>
#include <zephyr/dfu/mcuboot.h>
#include <zephyr/storage/flash_map.h>

static int erase_secondary_slot(void)
{
	const struct flash_area *area;
	const uint8_t area_id = flash_img_get_upload_slot();
	int err = flash_area_open(area_id, &area);

	if (err < 0) {
		return err;
	}

	err = flash_area_flatten(area, 0, area->fa_size);
	flash_area_close(area);
	return err;
}

int spaghetti_update_backend_is_trial(bool *trial)
{
	if (trial == NULL) {
		return -EINVAL;
	}

	*trial = !boot_is_img_confirmed();
	return 0;
}

int spaghetti_update_backend_active_slot(uint8_t *slot)
{
	const uint8_t active_area = boot_fetch_active_slot();

	if (slot == NULL) {
		return -EINVAL;
	}
	if (active_area == DT_FIXED_PARTITION_ID(DT_NODELABEL(slot0_partition))) {
		*slot = 0U;
		return 0;
	}
	if (active_area == DT_FIXED_PARTITION_ID(DT_NODELABEL(slot1_partition))) {
		*slot = 1U;
		return 0;
	}

	return -EIO;
}

int spaghetti_update_backend_prepare(void)
{
	const int swap_type = mcuboot_swap_type();
	int err;

	if (swap_type < 0) {
		return swap_type;
	}
	if (swap_type != BOOT_SWAP_TYPE_NONE) {
		return -EBUSY;
	}

	err = erase_secondary_slot();
	return err;
}

int spaghetti_update_backend_finalize_test(void)
{
	struct mcuboot_img_header header;
	const uint8_t area_id = flash_img_get_upload_slot();
	int err = boot_read_bank_header(area_id, &header, sizeof(header));

	if (err < 0) {
		return -EBADMSG;
	}
	if ((header.mcuboot_version != 1U) ||
	    (header.h.v1.image_size == 0U)) {
		return -EBADMSG;
	}

	return boot_request_upgrade(BOOT_UPGRADE_TEST);
}

int spaghetti_update_backend_cancel(void)
{
	const int err = erase_secondary_slot();

	return err;
}

int spaghetti_update_backend_confirm(void)
{
	const int err = boot_write_img_confirmed();

	return err;
}
