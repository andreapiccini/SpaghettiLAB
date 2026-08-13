import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Required so Vite's dev-server file watcher works when the source
    // tree is bind-mounted from the host into the container.
    watch: {
      usePolling: true,
    },
  },
});
