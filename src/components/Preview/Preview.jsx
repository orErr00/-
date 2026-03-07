import { useRef } from 'react'
import { renderMarkdown } from '../../utils/markdownParser'
import { getReadingTime } from '../../utils/readingTime'
import styles from './Preview.module.css'

function Preview({ content, activeStyle }) {
  const previewRef = useRef(null)
  const html = renderMarkdown(content)
  const readingTime = getReadingTime(content)

  return (
    <div className={styles.preview}>
      <div className={styles.meta}>
        <span className={styles.readingTime}>⏱ 预计阅读 {readingTime} 分钟</span>
      </div>
      <div
        ref={previewRef}
        className={`${styles.content} ${styles[activeStyle] || ''}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

export default Preview
