import { useState, useRef } from 'react';
import ModeSwitcher from '../ModeSwitcher/ModeSwitcher';
import StylePanel from '../StylePanel/StylePanel';
import Editor from '../Editor/Editor';
import Preview from '../Preview/Preview';
import ExportPanel from '../ExportPanel/ExportPanel';
import { defaultLayoutConfig } from '../../utils/layoutEngine';
import styles from './LayoutEditor.module.css';

const DEFAULT_TEXT = `# 欢迎使用文章排版编辑器

这是一个支持 **Markdown** 和纯文本两种模式的排版编辑器。

## 功能特性

- 实时预览排版效果
- 支持多种字体和主题
- 可调节字号、行高、段间距等参数
- 导出为 PNG 或 PDF
- 长文章自动切割为多张图片

## 引用示例

> 好的排版让阅读成为一种享受。

## 代码示例

\`\`\`javascript
const message = "Hello, World!";
console.log(message);
\`\`\`

---

感谢使用，祝写作愉快！
`;

export default function LayoutEditor() {
  const [mode, setMode] = useState('markdown');
  const [text, setText] = useState(DEFAULT_TEXT);
  const [layoutConfig, setLayoutConfig] = useState(defaultLayoutConfig);
  const [themeId, setThemeId] = useState('light');
  const [activeTab, setActiveTab] = useState('style'); // 'style' | 'export'

  const previewRef = useRef(null);

  return (
    <div className={styles.root}>
      {/* Left sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <ModeSwitcher mode={mode} onChange={setMode} />
        </div>

        <div className={styles.tabBar}>
          <button
            className={`${styles.tab} ${activeTab === 'style' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('style')}
          >
            排版
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'export' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('export')}
          >
            导出
          </button>
        </div>

        <div className={styles.sidebarContent}>
          {activeTab === 'style' ? (
            <StylePanel
              layoutConfig={layoutConfig}
              themeId={themeId}
              onChange={setLayoutConfig}
              onThemeChange={setThemeId}
            />
          ) : (
            <ExportPanel previewRef={previewRef} />
          )}
        </div>
      </aside>

      {/* Editor pane */}
      <section className={styles.editorPane}>
        <div className={styles.paneHeader}>编辑</div>
        <Editor value={text} mode={mode} onChange={setText} />
      </section>

      {/* Preview pane */}
      <section className={styles.previewPane}>
        <div className={styles.paneHeader}>预览</div>
        <Preview
          ref={previewRef}
          text={text}
          mode={mode}
          layoutConfig={layoutConfig}
          themeId={themeId}
        />
      </section>
    </div>
  );
}
