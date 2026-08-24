import { addCoreBinding, coreBindingId, createEmptyProject, CommandStack, projectId, type ProjectV1 } from "@spaghettilab/domain";
import type { PhysicalCompositionNodeData } from "@spaghettilab/physical-composition-model";
import { catalogEntriesForNodeKind } from "@spaghettilab/processing-block-catalog";
import { addGraphEdgeCommand, addGraphNodeCommand, deviceGraphLens, physicalGraphLens, updateAuthoringMetadataCommand } from "@spaghettilab/react-flow-adapter";
import { nodeDataFromCatalogEntry } from "../components/processing-graph/catalog-to-node.js";

/**
 * A explorable, pre-populated project — no real Core behind it (the binding
 * has no connection profile, so "Connetti" on it will fail cleanly like any
 * other unreachable Core), just real structure so a new user can click
 * around Physical Composition/Processing Graph and see the UI with actual
 * data instead of empty states. Built by running real domain commands
 * through a throwaway `CommandStack` — the exact same commands the UI itself
 * dispatches — rather than hand-assembling `ProjectV1` JSON, so nothing here
 * can be structurally invalid. Node kinds/catalog entries are real; there is
 * no live telemetry to fabricate, so screens that need it (Runtime &
 * Diagnostics, Deploy) correctly show their normal "not connected" state.
 */
export function buildDemoProject(name: string): ProjectV1 | null {
  const idResult = projectId(crypto.randomUUID());
  const bindingIdResult = coreBindingId(crypto.randomUUID());
  if (!idResult.ok || !bindingIdResult.ok) return null;

  const stack = new CommandStack(createEmptyProject(idResult.value, name));

  const bindingResult = stack.execute(
    addCoreBinding({ bindingId: bindingIdResult.value, expectedDeviceId: "demo-core-0001", connectionProfileId: "demo" }),
  );
  if (!bindingResult.ok) return null;

  const physical = physicalGraphLens(0);
  const device = deviceGraphLens(0);

  function placePhysical(id: string, data: PhysicalCompositionNodeData, comment: string, position: { x: number; y: number }): boolean {
    const added = stack.execute(addGraphNodeCommand(physical, { layer: "physical-composition", id, data }));
    if (!added.ok) return false;
    const meta = stack.execute(updateAuthoringMetadataCommand(id, { comment, position }));
    return meta.ok;
  }

  if (!placePhysical("demo-backbone", { kind: "backbone", variant: "" }, "Backbone", { x: 80, y: 80 })) return null;
  if (!placePhysical("demo-power", { kind: "power-source", passive: false }, "Alimentazione", { x: 340, y: 80 })) return null;
  if (!placePhysical("demo-connector", { kind: "connector" }, "Connettore", { x: 600, y: 80 })) return null;
  if (!placePhysical("demo-external", { kind: "external-device" }, "Dispositivo esterno", { x: 80, y: 200 })) return null;
  const moduleId = "demo-module";
  if (!placePhysical(moduleId, { kind: "module", driverTypeId: "", portId: -1, bayId: -1, railId: -1, electricalMode: "input-output", properties: {} }, "Module", { x: 340, y: 200 })) return null;

  const scheduleEntry = catalogEntriesForNodeKind("schedule").find((e) => e.availability === "shipped");
  const blockEntry = catalogEntriesForNodeKind("block").find((e) => e.availability === "shipped");
  const scheduleData = scheduleEntry && nodeDataFromCatalogEntry(scheduleEntry, moduleId);
  const blockData = blockEntry && nodeDataFromCatalogEntry(blockEntry, moduleId);

  function placeDevice(id: string, data: NonNullable<typeof scheduleData>, comment: string, position: { x: number; y: number }): boolean {
    const added = stack.execute(addGraphNodeCommand(device, { layer: "device-processing", id, data }));
    if (!added.ok) return false;
    const meta = stack.execute(updateAuthoringMetadataCommand(id, { comment, position }));
    return meta.ok;
  }

  const scheduleId = "demo-schedule";
  const blockId = "demo-block";
  if (scheduleData && !placeDevice(scheduleId, scheduleData, scheduleEntry!.label, { x: 80, y: 80 })) return null;
  if (blockData && !placeDevice(blockId, blockData, blockEntry!.label, { x: 340, y: 80 })) return null;
  if (scheduleData && blockData) {
    stack.execute(addGraphEdgeCommand(device, { id: "demo-edge", source: scheduleId, target: blockId, sourceHandle: "0", targetHandle: "0" }));
  }

  return stack.current;
}
