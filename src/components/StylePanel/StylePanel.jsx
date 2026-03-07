import styles from './StylePanel.module.css'

const STYLES = [
  { id: 'simple', name: '简洁', desc: '清晰简明' },
  { id: 'literary', name: '文艺', desc: '衬线优美' },
  { id: 'academic', name: '学术', desc: '等宽严谨' },
  { id: 'cinematic', name: '电影', desc: '暗色沉浸' },
]

function StylePanel({ activeStyle, onStyleChange }) {
  return (
    <div className={styles.panel}>
      <div className={styles.title}>🎨 排版风格</div>
      <div className={styles.cards}>
        {STYLES.map(s => (
          <button
            key={s.id}
            className={`${styles.card} ${activeStyle === s.id ? styles.active : ''}`}
            onClick={() => onStyleChange(s.id)}
          >
            <div className={styles.cardName}>{s.name}</div>
            <div className={styles.cardDesc}>{s.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default StylePanel
