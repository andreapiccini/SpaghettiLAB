export const DeviceProcessingGraphErrorCode = {
  CYCLE: "device-processing-graph.cycle",
  DANGLING_MODULE_REFERENCE: "device-processing-graph.dangling_module_reference",
  DUPLICATE_MODULE_TRIGGER: "device-processing-graph.duplicate_module_trigger",
  OUTPUT_NODE_AS_SOURCE: "device-processing-graph.output_node_as_source",
  UNKNOWN_HANDLE: "device-processing-graph.unknown_handle",
  MISSING_REQUIRED_INPUT: "device-processing-graph.missing_required_input",
  FAN_OUT_EXCEEDED: "device-processing-graph.fan_out_exceeded",
} as const;
