/** Local USB→WebSocket bridge (`make usb-bridge` in Firmware/core). Safari has no Web Serial. */

export const USB_BRIDGE_HOST = "127.0.0.1";
export const USB_BRIDGE_PORT = 8766;
export const USB_BRIDGE_ORIGIN = `ws://${USB_BRIDGE_HOST}:${USB_BRIDGE_PORT}`;

export function usbBridgeListUrl(): string {
  return `${USB_BRIDGE_ORIGIN}/list`;
}

export function usbBridgeCoreUrl(deviceIdHex: string): string {
  return `${USB_BRIDGE_ORIGIN}/core/${deviceIdHex.toLowerCase()}`;
}

export function isLoopbackHost(host: string): boolean {
  return host === "127.0.0.1" || host === "localhost" || host === "::1";
}
