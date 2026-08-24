declare module "virtual:spaghettilab-extensions" {
  export function installProductionExtensions(
    registry: import("./registry.js").ProductionExtensionRegistry,
  ): void;
}
