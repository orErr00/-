import { useRef } from 'react'
import { formatOneKey } from '../../utils/layoutEngine'
import styles from './Editor.module.css'

function Editor({ content, onContentChange }) {
  const textareaRef = useRef(null)

  const insertMd = (before, after) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.substring(start, end)
    const newText = content.substring(0, start) + before + selected + after + content.substring(end)
    onContentChange(newText)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const insertMdLine = (prefix) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const lineStart = content.lastIndexOf('\n', start - 1) + 1
    const newText = content.substring(0, lineStart) + prefix + content.substring(lineStart)
    onContentChange(newText)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + prefix.length, start + prefix.length)
    }, 0)
  }

  const handleFormat = () => {
    const formatted = formatOneKey(content)
    onContentChange(formatted)
  }

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <button className={styles.toolbarBtn} onClick={() => insertMd('**', '**')} title="粗体">
          <strong>B</strong>
        </button>
        <button className={styles.toolbarBtn} onClick={() => insertMd('*', '*')} title="斜体">
          <em>I</em>
        </button>
        <button className={styles.toolbarBtn} onClick={() => insertMdLine('# ')} title="一级标题">
          H1
        </button>
        <button className={styles.toolbarBtn} onClick={() => insertMdLine('## ')} title="二级标题">
          H2
        </button>
        <button className={styles.toolbarBtn} onClick={() => insertMdLine('### ')} title="三级标题">
          H3
        </button>
        <button className={styles.toolbarBtn} onClick={() => insertMdLine('- ')} title="无序列表">
          ≡
        </button>
        <button className={styles.toolbarBtn} onClick={() => insertMdLine('> ')} title="引用">
          ❝
        </button>
        <button className={styles.toolbarBtn} onClick={() => insertMdLine('---')} title="分割线">
          —
        </button>
        <span className={styles.toolbarSep} />
        <button className={styles.toolbarBtn} onClick={handleFormat} title="一键排版">
          ✨ 一键排版
        </button>
      </div>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="在此输入或粘贴长文内容，支持 Markdown 格式…"
      />
    </div>
  )
}

export default Editor
