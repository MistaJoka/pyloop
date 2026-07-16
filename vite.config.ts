import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // 0.0.0.0 — reachable from the LAN and, since Tailscale is just another
    // interface, from the tailnet too. `npm run dev` prints both URLs.
    host: true,
    // Vite does NOT read PORT on its own — it just takes 5173 and fights
    // whoever already has it. Honouring PORT lets the harness assign a free
    // one; bare `npm run dev` still lands on 5173 as before.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    // Fail loudly rather than drifting to 5174: if something is told to use a
    // port and quietly uses another, every URL printed for it is wrong.
    strictPort: true,
    // The tailnet hostname isn't in Vite's allowlist by default; without this
    // it answers with "Blocked request" on the phone.
    allowedHosts: ['.ts.net', '.local'],
  },
  // Pyodide is vendored into public/pyodide and loaded at runtime from there,
  // so Vite must not try to bundle or pre-bundle it.
  optimizeDeps: { exclude: ['pyodide'] },
  worker: { format: 'es' },
})
