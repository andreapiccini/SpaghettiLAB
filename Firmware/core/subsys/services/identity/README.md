# Identity and access control

[← Project README](../../../README.md)

Owns the Core hardware identity, friendly device name, bounded principal table,
role-derived permissions, and the audit ring.

## Files

| File | Role |
|---|---|
| `include/spaghetti/identity.h` | Device ID/name snapshot API. |
| `include/spaghetti/access_control.h` | Principal, permission, and audit API. |
| `identity.c` | `hwinfo` device ID plus Settings-backed name. |
| `access_control.c` | RAM principal table, Maintenance principal, audit ring. |

## Notes

- `device_id` is not a secret and is never modified after init.
- Credentials live in Wi-Fi/OTA/MQTT/remote-console vaults and bind a `principal_id`.
- Session invalidation hooks are stubs until Protocol 360.
