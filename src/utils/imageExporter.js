/**
 * Export content as a PNG image using a temporary off-screen element.
 * Falls back to a basic canvas approach if html2canvas is not available.
 */

import { renderMarkdown } from './markdownParser'

const STYLE_MAP = {
  simple: 'font-family: system-ui, sans-serif; line-height: 1.8;',
  literary: 'font-family: Georgia, serif; line-height: 1.9; font-size: 16px;',
  academic: 'font-family: "Courier New", monospace; line-height: 1.8; font-size: 14px;',
  cinematic: 'font-family: system-ui, sans-serif; background: #1a1a2e; color: #e0e0ff; line-height: 1.9;',
}

export async function exportAsImage(content, activeStyle) {
  const html = renderMarkdown(content)
  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 800px; padding: 40px;
    ${STYLE_MAP[activeStyle] || STYLE_MAP.simple}
    background: ${activeStyle === 'cinematic' ? '#1a1a2e' : '#ffffff'};
  `
  container.innerHTML = html
  document.body.appendChild(container)

  try {
    if (typeof window.html2canvas === 'function') {
      const canvas = await window.html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: activeStyle === 'cinematic' ? '#1a1a2e' : '#ffffff',
      })
      downloadCanvas(canvas)
    } else {
      const { default: html2canvas } = await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js').catch(() => ({ default: null }))
      if (html2canvas) {
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          backgroundColor: activeStyle === 'cinematic' ? '#1a1a2e' : '#ffffff',
        })
        downloadCanvas(canvas)
      } else {
        alert('图片导出功能暂不可用，请使用导出 PDF 功能')
      }
    }
  } finally {
    document.body.removeChild(container)
  }
}

function downloadCanvas(canvas) {
  const link = document.createElement('a')
  link.download = '排版内容.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}
