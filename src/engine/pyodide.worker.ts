/// <reference lib="webworker" />
import tracerSource from './tracer.py?raw'
import type { WorkerRequest, WorkerResponse } from './types'

type PyodideApi = {
  runPython: (code: string) => unknown
  globals: { get: (name: string) => (...args: string[]) => string }
}

let pyodide: PyodideApi

async function boot() {
  // Vendored under public/pyodide (see scripts/sync-pyodide.mjs). This is a
  // module worker, so it's a dynamic import of the ESM build — importScripts
  // is classic-worker only. @vite-ignore keeps Vite from trying to resolve a
  // runtime path at build time.
  // Built via `new URL` rather than a string literal on purpose: Vite folds
  // literals and then refuses to transform a /public path at build time. This
  // has to stay an opaque runtime fetch.
  const base = import.meta.env.BASE_URL
  const url = new URL(`${base}pyodide/pyodide.mjs`, self.location.origin).href
  const mod = await import(/* @vite-ignore */ url)
  pyodide = await mod.loadPyodide({ indexURL: `${base}pyodide/` })
  pyodide.runPython(tracerSource)
  post({ kind: 'ready' })
}

function post(msg: WorkerResponse) {
  ;(self as unknown as Worker).postMessage(msg)
}

const ready = boot()

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const req = e.data
  try {
    await ready
    let raw: string
    if (req.kind === 'trace') {
      raw = pyodide.globals.get('trace')(req.code, req.stdin)
    } else if (req.kind === 'run') {
      raw = pyodide.globals.get('run_plain')(req.code, req.stdin)
    } else {
      raw = pyodide.globals.get('run_with_asserts')(req.code, req.assertCode, req.stdin)
    }
    post({ id: req.id, ok: true, data: JSON.parse(raw) })
  } catch (err) {
    post({ id: req.id, ok: false, error: err instanceof Error ? err.message : String(err) })
  }
}
