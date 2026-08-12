# Data

[← Project README](../../README.md) · [Architecture](../../ARCHITECTURE.md)

Data distributes typed `spaghetti_record` values without exposing the producing
driver to consumers. The logger, tests, and MQTT adapter know the generic record
shape, not INA219 field names or I2C details.

## Responsibilities

Data owns the zbus channel, static observers, and diagnostic counters. It does not
perform acquisitions, own Modules or Ports, or retain publisher pointers. After each
successful zbus publish it forwards a copy to the Record Delivery boundary (phase
345).

## File

| File | Role |
|---|---|
| `include/spaghetti/data.h` | Public record publish API and statistics. |
| `subsys/data/data.c` | Channel, subscribers, logger, and publish. |
| `tests/data/` | Fan-out and bounded pool exhaustion. |

## API

```c
int spaghetti_data_init(void);
int spaghetti_data_publish(
	const struct spaghetti_record *record,
	k_timeout_t timeout);
int spaghetti_data_get_stats(struct spaghetti_data_stats *out);
```

The channel is `spaghetti_record_chan`. The logger prints source, schema, version,
boot ID, timestamp, sequence, and field ID/type without inventing field names.

## zbus capacity

Message subscribers share a static `net_buf` pool. Firmware configures buffers large
enough for one `spaghetti_record` (752 bytes on the minimal profile):

```ini
CONFIG_ZBUS_MSG_SUBSCRIBER_NET_BUF_STATIC_DATA_SIZE=768
```
