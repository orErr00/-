/**
 * Simple Markdown to HTML parser.
 * Supports: headings, lists, blockquotes, bold, italic, links, images, code, hr.
 */

function inlineMd(text) {
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%">')
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>')
  return text
}

export function renderMarkdown(text) {
  if (!text) return ''
  const lines = text.split('\n')
  const result = []
  let inUl = false
  let inOl = false

  for (const line of lines) {
    const isLi = line.match(/^[-*] (.+)/)
    const isOli = line.match(/^\d+\. (.+)/)

    if (!isLi && inUl) { result.push('</ul>'); inUl = false }
    if (!isOli && inOl) { result.push('</ol>'); inOl = false }

    const m3 = line.match(/^### (.+)/)
    const m2 = line.match(/^## (.+)/)
    const m1 = line.match(/^# (.+)/)
    const mq = line.match(/^> (.+)/)
    const mhr = line.match(/^---+$/)

    if (m3)      result.push(`<h3>${inlineMd(m3[1])}</h3>`)
    else if (m2) result.push(`<h2>${inlineMd(m2[1])}</h2>`)
    else if (m1) result.push(`<h1>${inlineMd(m1[1])}</h1>`)
    else if (mq) result.push(`<blockquote>${inlineMd(mq[1])}</blockquote>`)
    else if (isLi) {
      if (!inUl) { result.push('<ul>'); inUl = true }
      result.push(`<li>${inlineMd(isLi[1])}</li>`)
    } else if (isOli) {
      if (!inOl) { result.push('<ol>'); inOl = true }
      result.push(`<li>${inlineMd(isOli[1])}</li>`)
    } else if (mhr) {
      result.push('<hr>')
    } else if (line.trim() === '') {
      result.push('<p></p>')
    } else {
      result.push(`<p>${inlineMd(line)}</p>`)
    }
  }

  if (inUl) result.push('</ul>')
  if (inOl) result.push('</ol>')
  return result.join('')
}
