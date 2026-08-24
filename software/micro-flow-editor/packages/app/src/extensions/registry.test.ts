import { describe, expect, it } from "vitest";
import {
  createProductionExtensionRegistry,
  type ProductionExtensionDescriptor,
} from "./registry.js";

const extension: ProductionExtensionDescriptor = {
  apiVersion: 1,
  id: "example.production",
  version: "1.0.0",
  capabilities: ["fleet.read"],
};

describe("production extension registry", () => {
  it("is empty in a Community build", () => {
    expect(createProductionExtensionRegistry().list()).toEqual([]);
  });

  it("registers additive capabilities", () => {
    const registry = createProductionExtensionRegistry();
    registry.register(extension);
    expect(registry.hasCapability("fleet.read")).toBe(true);
    expect(registry.hasCapability("fleet.write")).toBe(false);
  });

  it("rejects duplicate extension ids", () => {
    const registry = createProductionExtensionRegistry();
    registry.register(extension);
    expect(() => registry.register(extension)).toThrow(/already registered/);
  });

  it("rejects an incompatible Studio API", () => {
    const registry = createProductionExtensionRegistry();
    expect(() => registry.register({ ...extension, apiVersion: 2 as 1 })).toThrow(
      /Unsupported Studio extension API/,
    );
  });

  it("exposes additive screens, services, commands and settings", async () => {
    const registry = createProductionExtensionRegistry();
    let started = false;
    const Component = () => null;
    registry.register({
      ...extension,
      screens: [{ id: "fleet", label: "Fleet", component: Component }],
      services: [
        {
          id: "fleet-client",
          start: () => {
            started = true;
          },
        },
      ],
      commands: [{ id: "sync", label: "Sync fleet", run: () => undefined }],
      settings: [{ id: "fleet", label: "Fleet", component: Component }],
    });
    expect(registry.screens().map(({ id }) => id)).toEqual(["fleet"]);
    expect(registry.commands().map(({ id }) => id)).toEqual(["sync"]);
    expect(registry.settings().map(({ id }) => id)).toEqual(["fleet"]);
    await registry.startServices();
    expect(started).toBe(true);
  });
});
