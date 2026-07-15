import { afterEach, describe, expect, it, vi } from 'vitest'
import { Runtime } from './runtime'
import { RunawayError, type WorkerRequest } from './types'

/** A fake worker we can drive.
 *
 *  Note `wedged`: a real worker is single-threaded, so one spinning on
 *  `while True:` answers NOTHING — not just the runaway request. Modelling it
 *  as "only the runaway hangs" would let the innocent request resolve before
 *  the kill, and the replay path would never be exercised. */
class StubWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((e: ErrorEvent) => void) | null = null
  terminated = false
  received: WorkerRequest[] = []
  index: number
  static live: StubWorker[] = []
  /** worker indices that answer nothing once wedged */
  static wedged = new Set<number>()
  /** ms before the 'ready' message; simulates Pyodide boot */
  static bootMs = 0

  constructor() {
    this.index = StubWorker.live.length
    StubWorker.live.push(this)
    setTimeout(() => this.emit({ kind: 'ready' }), StubWorker.bootMs)
  }
  private emit(data: unknown) {
    if (!this.terminated) this.onmessage?.({ data } as MessageEvent)
  }
  postMessage(req: WorkerRequest) {
    this.received.push(req)
    if (StubWorker.wedged.has(this.index)) return // spinning: answers nothing
    setTimeout(() => this.emit({ id: req.id, ok: true, data: { echo: req.kind } }), 0)
  }
  terminate() {
    this.terminated = true
  }
}

const spawn = () => new StubWorker() as unknown as Worker

afterEach(() => {
  vi.useRealTimers()
  StubWorker.live = []
  StubWorker.wedged.clear()
  StubWorker.bootMs = 0
})

describe('Runtime', () => {
  it('resolves a normal request', async () => {
    const rt = new Runtime(() => {}, spawn)
    await expect(rt.run('x = 1')).resolves.toMatchObject({ echo: 'run' })
  })

  it('waits for boot before arming the timeout', async () => {
    // A cold Pyodide boot can exceed the 10s ceiling. Arming the timer at
    // request time killed the still-booting worker and looped forever.
    vi.useFakeTimers()
    StubWorker.bootMs = 25_000 // slower than TIMEOUT_MS
    const rt = new Runtime(() => {}, spawn)
    const p = rt.run('x = 1')
    await vi.advanceTimersByTimeAsync(30_000)
    await expect(p).resolves.toBeTruthy()
    expect(StubWorker.live).toHaveLength(1) // never restarted
  })

  it('kills a runaway with RunawayError', async () => {
    vi.useFakeTimers()
    StubWorker.wedged.add(0)
    const rt = new Runtime(() => {}, spawn)
    const p = rt.trace('while True: pass')
    const assertion = expect(p).rejects.toBeInstanceOf(RunawayError)
    await vi.advanceTimersByTimeAsync(11_000)
    await assertion
    expect(StubWorker.live[0].terminated).toBe(true)
  })

  it('replays an innocent request instead of failing it with the runaway', async () => {
    // The bug: restart() rejected ALL pending, so a runaway in FIX made an
    // unrelated trace report "that ran forever".
    vi.useFakeTimers()
    StubWorker.wedged.add(0) // worker 0 spins; the replacement is healthy
    const rt = new Runtime(() => {}, spawn)
    const runaway = rt.trace('while True: pass')
    const innocent = rt.run('print(1)') // queued behind it, never answered
    const runawayAssertion = expect(runaway).rejects.toBeInstanceOf(RunawayError)

    await vi.advanceTimersByTimeAsync(11_000)
    await runawayAssertion
    // let the replacement worker boot and answer the replayed request
    await vi.advanceTimersByTimeAsync(100)
    await expect(innocent).resolves.toMatchObject({ echo: 'run' })
    expect(StubWorker.live).toHaveLength(2) // restarted once
    expect(StubWorker.live[1].received.map((r) => r.id)).toEqual([2]) // replayed
  })

  it('clears the timeout timer on success', async () => {
    vi.useFakeTimers()
    const rt = new Runtime(() => {}, spawn)
    const p = rt.run('x = 1')
    await vi.advanceTimersByTimeAsync(10)
    await p
    expect(vi.getTimerCount()).toBe(0) // no 10s timer left armed
  })

  it('rejects rather than hangs when the worker dies on boot', async () => {
    StubWorker.bootMs = 60_000 // never gets to 'ready' before erroring
    const rt = new Runtime(() => {}, () => {
      const w = new StubWorker()
      setTimeout(() => w.onerror?.({ message: 'boom' } as ErrorEvent), 0)
      return w as unknown as Worker
    })
    await expect(rt.run('x = 1')).rejects.toThrow(/failed to boot/)
  })

  it('reports status transitions', async () => {
    const seen: string[] = []
    const rt = new Runtime((s) => seen.push(s), spawn)
    await rt.whenReady()
    expect(seen).toEqual(['booting', 'ready'])
  })
})
