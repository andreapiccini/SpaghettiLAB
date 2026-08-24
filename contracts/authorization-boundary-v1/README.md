# Authorization boundary V1

Community provides complete local authorization: local principals, roles,
permissions, enforcement and audit remain public and work without an organization,
customer account or managed service.

Production may add organizational membership, centrally managed roles and resource
scope across customers, sites and fleets. That policy protects managed-service
operations and may further restrict a request. It never grants access that the Core,
Dashboard Host or other local authority denies.

Effective authorization therefore requires both applicable decisions:

`organizational policy allows` **and** `local authority allows`.

When Production is absent, only the existing local decision applies. Community does
not show disabled enterprise controls and does not require an online policy service.
