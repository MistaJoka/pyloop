import type { ReactNode } from 'react'

/** Just enough markdown for lesson copy: fences, **bold**, `code`, paragraphs.
 *  Content is authored by us, not user input — no sanitizing theatre needed. */

function inline(text: string, keyBase: string): ReactNode[] {
  const parts: ReactNode[] = []
  // **bold** must come before *italic* or the bold markers match as italics.
  const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) {
      parts.push(
        <strong key={`${keyBase}-b${i++}`} style={{ color: 'var(--ink)' }}>
          {tok.slice(2, -2)}
        </strong>,
      )
    } else if (tok.startsWith('*')) {
      parts.push(
        <em key={`${keyBase}-i${i++}`} style={{ color: 'var(--ink)' }}>
          {tok.slice(1, -1)}
        </em>,
      )
    } else {
      parts.push(
        <code
          key={`${keyBase}-c${i++}`}
          className="mono rounded px-1 py-0.5 text-[0.9em]"
          style={{ background: 'var(--panel-hi)', color: 'var(--amber)' }}
        >
          {tok.slice(1, -1)}
        </code>,
      )
    }
    last = m.index + tok.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export function Markdown({ text }: { text: string }) {
  const blocks = text.split(/```/)
  return (
    <div className="space-y-4 leading-relaxed">
      {blocks.map((block, bi) => {
        // Odd indices are fenced code blocks.
        if (bi % 2 === 1) {
          const body = block.replace(/^python\n/, '').replace(/\n$/, '')
          return (
            <pre
              key={bi}
              className="mono overflow-x-auto rounded p-4 text-[13px] leading-7"
              style={{ background: 'var(--panel)', color: 'var(--ink)' }}
            >
              {body}
            </pre>
          )
        }
        return block
          .split(/\n\s*\n/)
          .filter((p) => p.trim())
          .map((para, pi) => (
            <p key={`${bi}-${pi}`}>{inline(para.trim(), `${bi}-${pi}`)}</p>
          ))
      })}
    </div>
  )
}
