import { useState } from 'react'
import Editor from '../Editor/Editor'
import Preview from '../Preview/Preview'
import StylePanel from '../StylePanel/StylePanel'
import ExportPanel from '../ExportPanel/ExportPanel'
import styles from './LayoutEditor.module.css'

function LayoutEditor({ content, onContentChange, activeStyle, onStyleChange }) {
  const [showPreview, setShowPreview] = useState(false)

  const togglePreview = () => {
    setShowPreview(prev => !prev)
  }

  return (
    <div className={styles.container}>
      <div className={styles.editorLayout}>
        <div className={styles.editorPane}>
          {showPreview ? (
            <Preview content={content} activeStyle={activeStyle} />
          ) : (
            <Editor
              content={content}
              onContentChange={onContentChange}
            />
          )}
          <div className={styles.toggleBar}>
            <button
              className={`${styles.toggleBtn} ${!showPreview ? styles.active : ''}`}
              onClick={() => setShowPreview(false)}
            >
              📝 编辑
            </button>
            <button
              className={`${styles.toggleBtn} ${showPreview ? styles.active : ''}`}
              onClick={togglePreview}
            >
              👁 预览
            </button>
          </div>
        </div>
        <aside className={styles.sidebar}>
          <StylePanel activeStyle={activeStyle} onStyleChange={onStyleChange} />
          <ExportPanel content={content} activeStyle={activeStyle} />
          <div className={styles.helpSection}>
            <div className={styles.sectionTitle}>💡 使用说明</div>
            <div className={styles.helpText}>
              <p>• <strong>**粗体**</strong> <em>*斜体*</em></p>
              <p>• # 一级标题 &nbsp; ## 二级标题</p>
              <p>• - 无序列表 &nbsp; 1. 有序列表</p>
              <p>• &gt; 引用 &nbsp; --- 分割线</p>
              <p>• 一键排版：自动整理标点、空格</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default LayoutEditor
