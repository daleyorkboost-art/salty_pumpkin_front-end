import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("firebase") || id.includes("@firebase")) {
              return "firebase";
            }
            if (id.includes("react") || id.includes("react-dom") || id.includes("scheduler")) {
              return "react-vendor";
            }
            return "vendor";
          }
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "https://salty-pumpkin-back-end.onrender.com",
        changeOrigin: true,
      },
      "/uploads": {
        target: "https://salty-pumpkin-back-end.onrender.com",
        changeOrigin: true,
      },
    },
  },
});