import type { ComponentType } from "react";

export const STUDIO_EXTENSION_API_VERSION = 1;

export interface StudioScreenContribution {
  readonly id: string;
  readonly label: string;
  readonly component: ComponentType;
  readonly availability?: "always" | "advanced";
}
export interface StudioServiceContribution {
  readonly id: string;
  start(): void | Promise<void>;
}
export interface StudioCommandContribution {
  readonly id: string;
  readonly label: string;
  run(): void | Promise<void>;
}
export interface StudioSettingsContribution {
  readonly id: string;
  readonly label: string;
  readonly keywords?: readonly string[];
  readonly component: ComponentType;
}

export interface ProductionExtensionDescriptor {
  readonly apiVersion: typeof STUDIO_EXTENSION_API_VERSION;
  readonly id: string;
  readonly version: string;
  readonly capabilities: readonly string[];
  readonly screens?: readonly StudioScreenContribution[];
  readonly services?: readonly StudioServiceContribution[];
  readonly commands?: readonly StudioCommandContribution[];
  readonly settings?: readonly StudioSettingsContribution[];
}

export interface ProductionExtensionRegistry {
  register(extension: ProductionExtensionDescriptor): void;
  list(): readonly ProductionExtensionDescriptor[];
  hasCapability(capability: string): boolean;
  screens(): readonly StudioScreenContribution[];
  services(): readonly StudioServiceContribution[];
  commands(): readonly StudioCommandContribution[];
  settings(): readonly StudioSettingsContribution[];
  startServices(): Promise<void>;
}

class ExtensionRegistry implements ProductionExtensionRegistry {
  readonly #extensions = new Map<string, ProductionExtensionDescriptor>();

  register(extension: ProductionExtensionDescriptor): void {
    if (extension.apiVersion !== STUDIO_EXTENSION_API_VERSION)
      throw new Error(
        `Unsupported Studio extension API ${extension.apiVersion}; expected ${STUDIO_EXTENSION_API_VERSION}`,
      );
    const id = extension.id.trim();
    if (!id) throw new Error("Production extension id must not be empty");
    if (this.#extensions.has(id))
      throw new Error(`Production extension already registered: ${id}`);
    const candidate = this.#allContributionIds(extension);
    const occupied = new Set(
      this.list().flatMap((registered) => this.#allContributionIds(registered)),
    );
    const local = new Set<string>();
    for (const contributionId of candidate) {
      if (!contributionId.trim())
        throw new Error(`Empty contribution id in extension ${id}`);
      if (local.has(contributionId) || occupied.has(contributionId))
        throw new Error(`Studio contribution already registered: ${contributionId}`);
      local.add(contributionId);
    }
    this.#extensions.set(
      id,
      Object.freeze({
        ...extension,
        id,
        capabilities: Object.freeze([...extension.capabilities]),
        screens: Object.freeze([...(extension.screens ?? [])]),
        services: Object.freeze([...(extension.services ?? [])]),
        commands: Object.freeze([...(extension.commands ?? [])]),
        settings: Object.freeze([...(extension.settings ?? [])]),
      }),
    );
  }

  #allContributionIds(extension: ProductionExtensionDescriptor): string[] {
    return [
      ...(extension.screens ?? []).map(({ id }) => `screen:${id}`),
      ...(extension.services ?? []).map(({ id }) => `service:${id}`),
      ...(extension.commands ?? []).map(({ id }) => `command:${id}`),
      ...(extension.settings ?? []).map(({ id }) => `settings:${id}`),
    ];
  }

  list(): readonly ProductionExtensionDescriptor[] {
    return Object.freeze([...this.#extensions.values()]);
  }
  hasCapability(capability: string): boolean {
    return this.list().some((extension) => extension.capabilities.includes(capability));
  }
  screens(): readonly StudioScreenContribution[] {
    return Object.freeze(this.list().flatMap((extension) => extension.screens ?? []));
  }
  services(): readonly StudioServiceContribution[] {
    return Object.freeze(this.list().flatMap((extension) => extension.services ?? []));
  }
  commands(): readonly StudioCommandContribution[] {
    return Object.freeze(this.list().flatMap((extension) => extension.commands ?? []));
  }
  settings(): readonly StudioSettingsContribution[] {
    return Object.freeze(this.list().flatMap((extension) => extension.settings ?? []));
  }
  async startServices(): Promise<void> {
    for (const service of this.services()) await service.start();
  }
}

export function createProductionExtensionRegistry(): ProductionExtensionRegistry {
  return new ExtensionRegistry();
}
export const productionExtensions: ProductionExtensionRegistry =
  createProductionExtensionRegistry();
