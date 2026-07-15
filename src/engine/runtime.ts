import {
  RunawayError,
  type CheckResult, type DistOmit, type RunResult, type TraceResult,
  type WorkerRequest, type WorkerResponse,
} from './types'

/** Wall-clock ceiling per execution, measured from when Python is actually
 *  ready — NOT from when the request was made. Arming it during a cold Pyodide
 *  boot (~10MB of wasm) meant a slow connection timed out, killed the still-
 *  booting worker, and started over: a restart loop that never converged. */
const TIMEOUT_MS = 10000

type Pending = {
  req: WorkerRequest
  resolve: (v: unknown) => void
  reject: (e: Error) => void
  timer?: ReturnType<typeof setTimeout>
}

export type RuntimeStatus = 'booting' | 'ready' | 'dead'

type Spawn = () => Worker

const defaultSpawn: Spawn = () =>
  new Worker(new URL('./pyodide.worker.ts', import.meta.url), { type: 'module' })

export class Runtime {
  private worker: Worker | null = null
  private pending = new Map<number, Pending>()
  private seq = 0
  private ready!: Promise<void>
  private onStatus: (s: RuntimeStatus) => void
  private spawnWorker: Spawn

  /** spawnWorker is injectable so tests can drive a stub instead of booting
   *  10MB of wasm. */
  constructor(onStatus: (s: RuntimeStatus) => void = () => {}, spawnWorker: Spawn = defaultSpawn) {
    this.onStatus = onStatus
    this.spawnWorker = spawnWorker
    this.spawn()
  }

  private spawn() {
    this.onStatus('booting')
    this.worker = this.spawnWorker()
    this.ready = new Promise<void>((resolve, reject) => {
      this.worker!.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data
        if ('kind' in msg && msg.kind === 'ready') {
          this.onStatus('ready')
          resolve()
          return
        }
        if (!('id' in msg)) return
        const p = this.pending.get(msg.id)
        if (!p) return // stale message from a terminated worker
        clearTimeout(p.timer)
        this.pending.delete(msg.id)
        if (msg.ok) p.resolve(msg.data)
        else p.reject(new Error(msg.error))
      }
      // Without this a worker that dies on boot leaves `ready` pending forever
      // and every caller hangs.
      this.worker!.onerror = (e) => {
        console.error('[pyloop] worker died:', e.message)
        this.onStatus('dead')
        reject(new Error(`worker failed to boot: ${e.message}`))
      }
    })
    // Nothing awaits `ready` at spawn time; an unhandled rejection here would
    // be noise. Callers see it via send().
    this.ready.catch(() => {})
  }

  whenReady() {
    return this.ready
  }

  /** Kill the worker and start a fresh one.
   *
   *  `culpritId` is the request that earned the kill — it alone gets
   *  RunawayError. Everything else in flight was innocent and gets REPLAYED on
   *  the new worker. Previously all pending work was rejected together, so a
   *  runaway in FIX made an unrelated trace report "that ran forever". */
  restart(culpritId?: number) {
    this.worker?.terminate()
    const survivors: Pending[] = []
    for (const [id, p] of this.pending) {
      clearTimeout(p.timer)
      if (id === culpritId) p.reject(new RunawayError())
      else survivors.push(p)
    }
    this.pending.clear()
    this.spawn()
    for (const p of survivors) this.dispatch(p)
  }

  private dispatch(p: Pending) {
    this.pending.set(p.req.id, p)
    this.ready
      .then(() => {
        // Re-check: a restart may have dropped this request meanwhile.
        if (!this.pending.has(p.req.id)) return
        this.worker!.postMessage(p.req)
        p.timer = setTimeout(() => {
          if (this.pending.has(p.req.id)) this.restart(p.req.id)
        }, TIMEOUT_MS)
      })
      .catch((e: Error) => {
        this.pending.delete(p.req.id)
        p.reject(e)
      })
  }

  private send<T>(req: DistOmit<WorkerRequest, 'id'>): Promise<T> {
    const full = { ...req, id: ++this.seq } as WorkerRequest
    return new Promise<T>((resolve, reject) => {
      this.dispatch({ req: full, resolve: resolve as (v: unknown) => void, reject })
    })
  }

  /** `stdin` feeds input(). Without it input() raises EOFError, so any lesson
   *  that reads input needs the content to declare what gets typed. */
  trace(code: string, stdin = '') {
    return this.send<TraceResult>({ kind: 'trace', code, stdin })
  }

  run(code: string, stdin = '') {
    return this.send<RunResult>({ kind: 'run', code, stdin })
  }

  checkAsserts(code: string, assertCode: string, stdin = '') {
    return this.send<CheckResult>({ kind: 'asserts', code, assertCode, stdin })
  }
}
