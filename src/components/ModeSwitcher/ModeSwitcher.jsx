import styles from './ModeSwitcher.module.css'

function ModeSwitcher() {
  const handleBackToMedia = () => {
    window.location.href = '/'
  }

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>📄</span>
        <span className={styles.brandName}>排版导出系统</span>
      </div>
      <nav className={styles.nav}>
        <button className={styles.backBtn} onClick={handleBackToMedia}>
          <span className={styles.backIcon}>🎬</span>
          返回媒体管理
        </button>
      </nav>
    </header>
  )
}

export default ModeSwitcher
