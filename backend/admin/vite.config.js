import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Served under /admin by the backend in production (single-service deploy).
  base: "/admin/",
  server: { port: 5173 },
});
