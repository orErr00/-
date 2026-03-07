import { forwardRef } from 'react';
import { parseMarkdown } from '../../utils/markdownParser';
import { buildPreviewStyle, themes } from '../../utils/layoutEngine';
import { calcReadingInfo, formatReadingInfo } from '../../utils/readingTime';
import styles from './Preview.module.css';

/**
 * Renders plain text paragraphs (no Markdown parsing).
 */
function PlainRenderer({ text, layoutConfig }) {
  const paragraphs = text.split(/\n\n+/);
  return (
    <>
      {paragraphs.map((para, i) => (
        <p
          key={i}
          className={styles.plainParagraph}
          style={{ textIndent: `${layoutConfig.textIndent}em` }}
        >
          {para}
        </p>
      ))}
    </>
  );
}

/**
 * Preview - renders the styled article preview.
 * The ref is forwarded to the inner content wrapper for export.
 */
const Preview = forwardRef(function Preview({ text, mode, layoutConfig, themeId }, ref) {
  const theme = themes[themeId] || themes.light;
  const previewStyle = buildPreviewStyle(theme, layoutConfig);
  const { wordCount, readingMinutes } = calcReadingInfo(text);

  return (
    <div className={styles.outer}>
      <div
        ref={ref}
        className={styles.container}
        style={previewStyle}
      >
        {/* Reading info */}
        {layoutConfig.showReadingInfo && (
          <div className={styles.readingInfo}>
            {formatReadingInfo(wordCount, readingMinutes)}
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>
          {mode === 'markdown' ? (
            <div
              className={styles.markdownBody}
              dangerouslySetInnerHTML={{ __html: parseMarkdown(text) }}
            />
          ) : (
            <PlainRenderer text={text} layoutConfig={layoutConfig} />
          )}
        </div>
      </div>
    </div>
  );
});

export default Preview;
