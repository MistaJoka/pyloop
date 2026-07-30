/** Thin two-segment progress bar: green for clean clears, amber for rungs
 *  cleared with help or a guessed prediction ("worth another go"). Fills
 *  from zero once on mount. Replaces the old dot pips. */
export function ProgressBar({
  clean,
  shaky,
  total,
}: {
  clean: number
  shaky: number
  total: number
}) {
  const filled = total > 0 ? ((clean + shaky) / total) * 100 : 0
  return (
    <div
      className="h-1 w-full overflow-hidden rounded-full"
      style={{ background: 'var(--rule)' }}
      aria-label={`${clean + shaky} of ${total} cleared${shaky ? `, ${shaky} worth another go` : ''}`}
    >
      <div className="bar-fill flex h-full" style={{ width: `${filled}%` }}>
        <div style={{ flex: clean, background: 'var(--good)' }} />
        <div style={{ flex: shaky, background: 'var(--amber)' }} />
      </div>
    </div>
  )
}
