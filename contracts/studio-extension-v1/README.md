# Studio extension API V1

Studio Community has an empty extension registry by default. A downstream build may
inject one JavaScript installer through `SPAGHETTI_SOFTWARE_EXTENSION_MANIFEST`.
The installer directory must also contain `spaghetti-studio-extension.json` with
contract `spaghettilab.studio-extension` and API version `1`.

An installer exports `installProductionExtensions(registry)` and registers descriptors
with `apiVersion: 1`. Extensions may contribute:

- screens rendered by the application shell and shown in the navigation rail;
- services started after all extensions have registered;
- command-palette actions;
- settings panes shown in the Extensions settings group.

Contribution identifiers are unique per surface across every registered extension.
Missing or incompatible build manifests fail before Vite loads downstream code, while
incompatible descriptors fail during registry installation.

Community never imports the downstream package. With the environment variable absent,
Vite supplies a no-op installer and the registry remains empty.
