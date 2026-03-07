import { renderMarkdown } from '../../utils/markdownParser'
import { exportAsImage } from '../../utils/imageExporter'
import styles from './ExportPanel.module.css'

function ExportPanel({ content, activeStyle }) {
  const handleExportPDF = () => {
    if (!content?.trim()) {
      alert('请先输入内容')
      return
    }
    const html = renderMarkdown(content)
    const styleMap = {
      simple: 'font-family: system-ui, sans-serif; line-height: 1.8;',
      literary: 'font-family: Georgia, serif; line-height: 1.9; font-size: 16px;',
      academic: 'font-family: "Courier New", monospace; line-height: 1.8; font-size: 14px;',
      cinematic: 'font-family: system-ui, sans-serif; background: #1a1a2e; color: #e0e0ff; line-height: 1.9;',
    }
    const doc = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><style>
      body { ${styleMap[activeStyle] || styleMap.simple} padding: 40px; max-width: 800px; margin: 0 auto; }
      h1,h2,h3 { margin: 16px 0 8px; }
      p { margin: 8px 0; }
      blockquote { border-left: 4px solid #6c63ff; padding: 8px 16px; margin: 12px 0; background: rgba(108,99,255,0.1); }
      code { background: rgba(0,0,0,0.1); padding: 1px 4px; border-radius: 3px; }
      ul,ol { padding-left: 24px; }
      hr { border: none; border-top: 1px solid #ccc; margin: 16px 0; }
      @media print { body { padding: 20px; } }
    </style></head><body>${html}</body></html>`
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(doc)
      win.document.close()
      setTimeout(() => win.print(), 500)
    }
  }

  const handleExportImage = async () => {
    if (!content?.trim()) {
      alert('请先输入内容')
      return
    }
    await exportAsImage(content, activeStyle)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.title}>📥 导出</div>
      <div className={styles.buttons}>
        <button className={styles.btnPrimary} onClick={handleExportPDF}>
          🖨️ 导出PDF
        </button>
        <button className={styles.btnSecondary} onClick={handleExportImage}>
          📷 导出图片
        </button>
      </div>
      <p className={styles.hint}>
        导出PDF：点击后在打印对话框选择&ldquo;另存为PDF&rdquo;
      </p>
    </div>
  )
}

export default ExportPanel
