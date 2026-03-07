import styles from './Editor.module.css';

/**
 * Editor - textarea for content input.
 */
export default function Editor({ value, mode, onChange }) {
  const placeholder =
    mode === 'markdown'
      ? '在这里输入 Markdown 内容...\n\n支持标题、列表、引用、代码块、图片、分割线、粗体、斜体等语法。'
      : '在这里输入纯文本内容...\n\n用空行分隔段落。';

  return (
    <div className={styles.wrapper}>
      <textarea
        className={styles.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  );
}
