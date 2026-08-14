import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function usbBridgeProxyTarget(): string {
  return existsSync("/.dockerenv")
    ? "http://host.docker.internal:8766"
    : "http://127.0.0.1:8766";
}

/** Host-only: Docker on macOS cannot open USB serial. `make up-d` starts the same script. */
function spaghettiUsbBridge(): Plugin {
  return {
    name: "spaghetti-usb-bridge",
    configureServer() {
      if (existsSync("/.dockerenv")) return;
      const script = fileURLToPath(new URL("../../scripts/usb-bridge.sh", import.meta.url));
      spawn("sh", [script, "start"], { detached: true, stdio: "ignore" }).unref();
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), spaghettiUsbBridge()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Required so Vite's dev-server file watcher works when the source
    // tree is bind-mounted from the host into the container.
    watch: {
      usePolling: true,
    },
    // Safari talks only to :5173. Docker Vite forwards to the host USB bridge.
    proxy: {
      "/usb-bridge": {
        target: usbBridgeProxyTarget(),
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/usb-bridge/, "") || "/",
      },
    },
  },
});
