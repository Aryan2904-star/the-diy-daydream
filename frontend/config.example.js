/* ==================================================================
   The DIY Daydream — FRONTEND config (the site's "env")
   ------------------------------------------------------------------
   1. Copy this file to "config.js"  (cp config.example.js config.js)
   2. Set the URLs below to point at your backend server.
   3. config.js is gitignored — keep per-environment values there.
   ================================================================== */
window.DDD_CONFIG = {
  // Base URL of the backend API.
  // Local dev:   http://localhost:4000
  // Production:  https://your-backend.onrender.com   (no trailing slash)
  API_URL: "http://localhost:4000",

  // Public Socket.IO URL for live catalogue updates.
  // Usually the SAME as API_URL.
  SOCKET_URL: "http://localhost:4000",
};
