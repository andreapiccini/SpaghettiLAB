# Operational domain boundary V1

Community identifies physical Cores through the non-secret hardware device ID and
binds them locally to projects. A personal project requires no customer, site, fleet,
tenant or managed-device record.

Production owns the operational hierarchy:

- **managed device** — operational record referring to one public hardware device ID;
- **customer** — contractual owner/tenant of managed resources;
- **site** — deployment location belonging to exactly one customer;
- **fleet** — operational grouping belonging to exactly one customer; a device may
  participate in multiple fleets for rollout or maintenance purposes.

A managed device belongs to exactly one customer. Its site and every fleet assignment
must belong to that same customer. The managed-device ID is distinct from the hardware
device ID so replacement, retirement and operational history do not redefine the
public hardware identity.

Community may exchange the public identifiers for interoperability, but it does not
implement or require the Production hierarchy.
