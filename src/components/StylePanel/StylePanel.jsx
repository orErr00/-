import { fonts, themes } from '../../utils/layoutEngine';
import styles from './StylePanel.module.css';

/**
 * StylePanel - controls layout parameters and theme.
 */
export default function StylePanel({ layoutConfig, themeId, onChange, onThemeChange }) {
  function handleChange(key, value) {
    onChange({ ...layoutConfig, [key]: value });
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>排版设置</h3>

      {/* Theme */}
      <div className={styles.group}>
        <label className={styles.label}>主题</label>
        <div className={styles.themeGrid}>
          {Object.values(themes).map((t) => (
            <button
              key={t.id}
              className={`${styles.themeBtn} ${themeId === t.id ? styles.themeActive : ''}`}
              style={{ background: t.backgroundColor, color: t.textColor, borderColor: t.headingColor }}
              onClick={() => onThemeChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font */}
      <div className={styles.group}>
        <label className={styles.label}>字体</label>
        <select
          className={styles.select}
          value={layoutConfig.fontFamily}
          onChange={(e) => handleChange('fontFamily', e.target.value)}
        >
          {fonts.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <div className={styles.group}>
        <label className={styles.label}>字号 ({layoutConfig.fontSize}px)</label>
        <input
          type="range"
          min="12"
          max="24"
          step="1"
          value={layoutConfig.fontSize}
          onChange={(e) => handleChange('fontSize', Number(e.target.value))}
          className={styles.range}
        />
      </div>

      {/* Line Height */}
      <div className={styles.group}>
        <label className={styles.label}>行高 ({layoutConfig.lineHeight})</label>
        <input
          type="range"
          min="1.2"
          max="3"
          step="0.1"
          value={layoutConfig.lineHeight}
          onChange={(e) => handleChange('lineHeight', Number(e.target.value))}
          className={styles.range}
        />
      </div>

      {/* Letter Spacing */}
      <div className={styles.group}>
        <label className={styles.label}>字间距 ({layoutConfig.letterSpacing}em)</label>
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.01"
          value={layoutConfig.letterSpacing}
          onChange={(e) => handleChange('letterSpacing', Number(e.target.value))}
          className={styles.range}
        />
      </div>

      {/* Paragraph Spacing */}
      <div className={styles.group}>
        <label className={styles.label}>段间距 ({layoutConfig.paragraphSpacing}px)</label>
        <input
          type="range"
          min="4"
          max="48"
          step="2"
          value={layoutConfig.paragraphSpacing}
          onChange={(e) => handleChange('paragraphSpacing', Number(e.target.value))}
          className={styles.range}
        />
      </div>

      {/* Text Indent (plain mode) */}
      <div className={styles.group}>
        <label className={styles.label}>段首缩进 ({layoutConfig.textIndent}em)</label>
        <input
          type="range"
          min="0"
          max="4"
          step="0.5"
          value={layoutConfig.textIndent}
          onChange={(e) => handleChange('textIndent', Number(e.target.value))}
          className={styles.range}
        />
      </div>

      {/* Content Width */}
      <div className={styles.group}>
        <label className={styles.label}>内容宽度 ({layoutConfig.contentWidth}px)</label>
        <input
          type="range"
          min="320"
          max="480"
          step="10"
          value={layoutConfig.contentWidth}
          onChange={(e) => handleChange('contentWidth', Number(e.target.value))}
          className={styles.range}
        />
      </div>

      {/* Show Reading Info */}
      <div className={styles.group}>
        <label className={styles.checkLabel}>
          <input
            type="checkbox"
            checked={layoutConfig.showReadingInfo}
            onChange={(e) => handleChange('showReadingInfo', e.target.checked)}
          />
          显示阅读信息
        </label>
      </div>
    </div>
  );
}
