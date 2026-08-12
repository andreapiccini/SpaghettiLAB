# @spaghettilab/domain

Pure TypeScript domain kernel — see `REACT_FLOW_ARCHITECTURE.md` § Domain Kernel.
**Must never import React, React Flow, a transport library, or any browser API.**
This is enforced by this package having no such dependency in `package.json` (there
is nothing to accidentally `import` — a build step can later add a static check if
this ever needs enforcing at the type level, e.g. via `dependency-cruiser`).

## What's here (S011)

Only the abstract infrastructure ports the rest of the domain will depend on —
no domain types yet (Project, Module, Rule, ... arrive in S012+):

- `Clock` — current time, so nothing calls `Date.now()` directly.
- `UuidGenerator` — ID generation, so nothing calls `crypto.randomUUID()` directly.
- `Storage` — key/value persistence for authoring data.
- `CredentialStore` — secrets addressed by opaque reference, never by value.
- `Logger` — structured logging (message + context object, not string interpolation).
- `AuditLog` — append-only trail for sensitive operations.

Every port has an in-memory/deterministic fake in `src/ports/fakes/`, used by this
package's own tests and meant to be reused by every other package's tests too — no
test in this workspace should need a browser, a real clock, or a real filesystem.

## Commands

```sh
npm run -w @spaghettilab/domain typecheck
npm run -w @spaghettilab/domain lint
npm run -w @spaghettilab/domain test
npm run -w @spaghettilab/domain test:coverage
```
