import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // 0.0.0.0 — reachable from the LAN and, since Tailscale is just another
    // interface, from the tailnet too. `npm run dev` prints both URLs.
    host: true,
    // The tailnet hostname isn't in Vite's allowlist by default; without this
    // it answers with "Blocked request" on the phone.
    allowedHosts: ['.ts.net', '.local'],
  },
  // Pyodide is vendored into public/pyodide and loaded at runtime from there,
  // so Vite must not try to bundle or pre-bundle it.
  optimizeDeps: { exclude: ['pyodide'] },
  worker: { format: 'es' },
})
