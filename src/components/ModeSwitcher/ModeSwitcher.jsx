import styles from './ModeSwitcher.module.css';

/**
 * ModeSwitcher - toggles between "plain" and "markdown" editing modes.
 */
export default function ModeSwitcher({ mode, onChange }) {
  return (
    <div className={styles.wrapper}>
      <button
        className={`${styles.btn} ${mode === 'markdown' ? styles.active : ''}`}
        onClick={() => onChange('markdown')}
      >
        Markdown
      </button>
      <button
        className={`${styles.btn} ${mode === 'plain' ? styles.active : ''}`}
        onClick={() => onChange('plain')}
      >
        纯文本
      </button>
    </div>
  );
}
