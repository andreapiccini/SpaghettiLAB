# Community extension boundary

SpaghettiLAB Community is a complete, standalone project. Its hardware,
firmware and software must build and run without credentials or access to any
private repository.

Commercial and production systems may consume this repository as a pinned Git
submodule and add modules, plugins, deployment services, security operations and
customer-specific integrations around it.

The dependency direction is intentionally one-way:

```text
Production extension ---> Community interface
Community             -X-> Production extension
```

Community code must never import private packages, refer to private filesystem
paths, download private artifacts during its build, or require a commercial
licence merely to complete its normal tests. Optional capabilities are exposed
through versioned interfaces, protocol capabilities or plugin manifests.

Firmware and software remain independently buildable. Their integration occurs
through Protocol V1, schemas and generated/public SDK contracts, not through
source imports across the two trees.

## Firmware admission

A downstream firmware directory is loaded only when the build explicitly sets
`SPAGHETTI_FIRMWARE_EXTENSION_DIR`. Before evaluating its `CMakeLists.txt`,
Community validates `spaghetti-extension.json` against
[`contracts/firmware-extension-v1`](../../contracts/firmware-extension-v1/README.md).
Missing, unknown or incompatible manifests stop configuration before private
sources are added to the application.

This directory-level API check complements descriptor-level checks performed by
the module, rule, block, discovery and feature-pack registries. It does not promise
binary compatibility across independently compiled Zephyr images: Community and
the extension are compiled together against the exact pinned Community commit.

## Studio admission

Studio uses the public
[`contracts/studio-extension-v1`](../../contracts/studio-extension-v1/README.md)
contract. With no downstream manifest, its screens, services, commands and settings
registries are empty. A downstream Vite build may inject an installer explicitly;
the adjacent admission manifest and every registered descriptor must declare API V1.

Private screens use the Community shell, private commands use the Community command
palette, private panes use the Extensions settings group, and private services start
only after registration. Removing the installer restores the unchanged Community
experience.
