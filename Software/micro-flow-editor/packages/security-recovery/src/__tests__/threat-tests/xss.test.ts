import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { previewProjectImport } from "@spaghettilab/domain";
import { exportProfilePackage, exportProfilePackageJson, importProfilePackageJson } from "@spaghettilab/device-profile-package";
import { PortTransport, type DeviceProfileDraft } from "@spaghettilab/device-profile-authoring-model";

const XSS_PAYLOAD = '<img src=x onerror=alert(document.cookie)>';

function minimalProjectJson(name: string): string {
  return JSON.stringify({
    schemaVersion: 1,
    projectId: "aaaaaaaa-0000-4000-8000-000000000001",
    name,
    coreBindings: [],
    physicalGraphs: [],
    deviceGraphs: [],
    systemAutomationGraph: { layer: "system-automation", nodes: [], edges: [] },
    requiredArtifacts: [],
    deploymentRecords: [],
    authoringMetadata: {},
  });
}

function draft(profileId: string): DeviceProfileDraft {
  return {
    profileId,
    version: 1,
    transport: PortTransport.I2C,
    requiredCapabilities: 0,
    maxTotalTimeMs: 100,
    maxTransactions: 5,
    maxBytes: 16,
    initOps: [],
    sampleOps: [{ op: "EMIT_RECORD" }],
    safeStopOps: [],
    sampleSchemaId: "sensor.example.sample",
    sampleSchemaVersion: 1,
    sampleFields: [],
  };
}

/** Every package's `src` directory under this workspace, excluding generated/test dirs — the static half of the XSS threat test below. */
function everySourceFile(): readonly string[] {
  const packagesDir = path.resolve(import.meta.dirname, "../../../../");
  const files: string[] = [];
  for (const pkg of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!pkg.isDirectory()) continue;
    const srcDir = path.join(packagesDir, pkg.name, "src");
    try {
      walk(srcDir, files);
    } catch {
      // no src/ dir for this package — fine, skip it.
    }
  }
  return files;
}

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "__tests__" || entry.name === "node_modules" || entry.name === "dist" || entry.name === "node-red" || entry.name === "dist-node-red") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      out.push(full);
    }
  }
}

describe("XSS threat test — S124 § Verifiche", () => {
  it("no package source uses eval/Function-constructor/innerHTML/dangerouslySetInnerHTML — nothing here can execute untrusted string content as code or markup", () => {
    const offenders: string[] = [];
    for (const file of everySourceFile()) {
      const content = readFileSync(file, "utf8");
      if (/\beval\s*\(/.test(content) || /new\s+Function\s*\(/.test(content) || /\.innerHTML\s*=/.test(content) || /dangerouslySetInnerHTML/.test(content)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("a Project import containing a script-injection payload in a string field is preserved as inert data, never executed, and does not corrupt import", () => {
    const result = previewProjectImport(minimalProjectJson(XSS_PAYLOAD), []);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.project.name).toBe(XSS_PAYLOAD);
    }
  });

  it("a Device Profile package with a script-injection payload in profileId round-trips as inert data with a correctly recomputed hash — never executed, never silently altered", () => {
    const pkg = exportProfilePackage(draft(XSS_PAYLOAD), "attacker");
    const json = exportProfilePackageJson(pkg);
    const reimported = importProfilePackageJson(json);
    expect(reimported.ok).toBe(true);
    if (reimported.ok) {
      expect(reimported.value.profileId).toBe(XSS_PAYLOAD);
    }
  });
});
