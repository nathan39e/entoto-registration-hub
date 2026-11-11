import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/__l5e/assets-v1": {
        target: "https://id-preview--813b587f-bf72-44da-ad24-4b4123495f66.lovable.app",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Force one React copy so stale prebundled chunks can't load a second instance.
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: { include: ["react", "react-dom", "react/jsx-runtime"] },
}));
