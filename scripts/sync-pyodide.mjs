// Vendors the Pyodide runtime from node_modules into public/pyodide so the app
// loads it from its own origin: pinned version, works offline, no CDN at runtime.
// Run via `npm run sync-pyodide` (postinstall-free so it stays explicit).
import { cp, mkdir, readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'node_modules/pyodide')
const dest = resolve(root, 'public/pyodide')

// The full package includes source maps and every prebuilt wheel (~200MB).
// We only need the runtime core plus the package index; numpy/pandas resolve
// from here later without a network hop.
const KEEP = /\.(wasm|mjs|js|json|zip|ts)$/
const SKIP = /(\.map$|^package\.json$|^README|^LICENSE)/

await mkdir(dest, { recursive: true })
const entries = await readdir(src, { withFileTypes: true })
let n = 0
for (const e of entries) {
  if (!e.isFile()) continue
  if (!KEEP.test(e.name) || SKIP.test(e.name)) continue
  await cp(resolve(src, e.name), resolve(dest, e.name))
  n++
}
console.log(`vendored ${n} pyodide files -> public/pyodide`)
