export {
  isModuleNodeData,
  type BackboneNodeData,
  type ConnectorNodeData,
  type ElectricalMode,
  type ExternalDeviceNodeData,
  type ModuleEndpoint,
  type ModuleNodeData,
  type PhysicalCompositionNodeData,
  type PowerSourceNodeData,
} from "./entities.js";
export { PhysicalCompositionErrorCode } from "./errors.js";
export { PowerAdmission, RailAssurance, requiresPowerAcknowledgement } from "./power.js";
export { validateComposition, type ModuleTransport, type TransportOf } from "./validate-composition.js";
export { parseW1RomHex, W1_ROM_BYTE_LENGTH } from "./w1-rom.js";
export {
  moduleFromAcceptedDiscovery,
  previewDiscoveryAccept,
  previewDiscoveryAcceptDiff,
  type DiscoveryAcceptChoice,
  type DiscoveryAcceptPreview,
} from "./discovery.js";
