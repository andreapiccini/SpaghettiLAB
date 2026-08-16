export type PortSetupRequest =
  | { readonly kind: "pick" }
  | { readonly kind: "pin"; readonly portId: number; readonly pinIndex?: number; readonly moduleNodeId?: string }
  | { readonly kind: "protocol"; readonly portId: number; readonly moduleNodeId?: string };
