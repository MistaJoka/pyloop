// A real-enough localStorage. We test our own persistence logic, not the
// browser's Storage — so a stub beats pulling in jsdom (whose Storage doesn't
// currently wire up under vitest 4 anyway).
class MemoryStorage implements Storage {
  private map = new Map<string, string>()
  get length() {
    return this.map.size
  }
  clear() {
    this.map.clear()
  }
  getItem(k: string) {
    return this.map.get(k) ?? null
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null
  }
  removeItem(k: string) {
    this.map.delete(k)
  }
  setItem(k: string, v: string) {
    this.map.set(k, String(v))
  }
}

globalThis.localStorage = new MemoryStorage()
