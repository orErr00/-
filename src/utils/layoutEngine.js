/**
 * Default layout configuration.
 */
export const defaultLayoutConfig = {
  fontFamily: 'default-sans',
  fontSize: 16,
  lineHeight: 1.8,
  letterSpacing: 0,
  paragraphSpacing: 16,
  textIndent: 2,
  contentWidth: 380,
  showReadingInfo: true,
};

/**
 * Built-in font definitions.
 */
export const fonts = [
  { id: 'default-sans', label: '默认无衬线', value: 'system-ui, -apple-system, sans-serif' },
  { id: 'serif', label: '衬线体', value: 'Georgia, "Times New Roman", serif' },
  { id: 'monospace', label: '等宽', value: '"Courier New", Courier, monospace' },
  { id: 'huiwen-mincho', label: '汇文明朝体', value: '"Huiwen-mincho", serif' },
];

/**
 * Returns the CSS font-family string for a given font id.
 * @param {string} fontId
 * @returns {string}
 */
export function getFontFamily(fontId) {
  const font = fonts.find((f) => f.id === fontId);
  return font ? font.value : fonts[0].value;
}

/**
 * Built-in themes.
 */
export const themes = {
  light: {
    id: 'light',
    label: '明亮',
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    headingColor: '#111111',
    quoteBackground: '#f5f5f5',
    quoteBorder: '#cccccc',
    quoteColor: '#555555',
    codeBackground: '#f4f4f4',
    codeColor: '#333333',
    hrColor: '#dddddd',
  },
  reading: {
    id: 'reading',
    label: '阅读',
    backgroundColor: '#fdf6e3',
    textColor: '#3b3b3b',
    headingColor: '#222222',
    quoteBackground: '#f0e9d2',
    quoteBorder: '#c8a96e',
    quoteColor: '#5c4b2a',
    codeBackground: '#ede8d6',
    codeColor: '#444444',
    hrColor: '#c8b89a',
  },
  xiaohongshu: {
    id: 'xiaohongshu',
    label: '小红书',
    backgroundColor: '#fff0f3',
    textColor: '#333333',
    headingColor: '#ff2442',
    quoteBackground: '#ffe4e8',
    quoteBorder: '#ff2442',
    quoteColor: '#cc1a33',
    codeBackground: '#f8d7db',
    codeColor: '#333333',
    hrColor: '#ffaab7',
  },
  dark: {
    id: 'dark',
    label: '暗色',
    backgroundColor: '#1e1e1e',
    textColor: '#d4d4d4',
    headingColor: '#ffffff',
    quoteBackground: '#2d2d2d',
    quoteBorder: '#555555',
    quoteColor: '#aaaaaa',
    codeBackground: '#2d2d2d',
    codeColor: '#ce9178',
    hrColor: '#444444',
  },
};

/**
 * Generates CSS custom properties object from a theme and layout config.
 * @param {object} theme
 * @param {object} layoutConfig
 * @returns {object} CSS style object for the preview container
 */
export function buildPreviewStyle(theme, layoutConfig) {
  return {
    '--bg-color': theme.backgroundColor,
    '--text-color': theme.textColor,
    '--heading-color': theme.headingColor,
    '--quote-bg': theme.quoteBackground,
    '--quote-border': theme.quoteBorder,
    '--quote-color': theme.quoteColor,
    '--code-bg': theme.codeBackground,
    '--code-color': theme.codeColor,
    '--hr-color': theme.hrColor,
    '--font-family': getFontFamily(layoutConfig.fontFamily),
    '--font-size': `${layoutConfig.fontSize}px`,
    '--line-height': layoutConfig.lineHeight,
    '--letter-spacing': `${layoutConfig.letterSpacing}em`,
    '--paragraph-spacing': `${layoutConfig.paragraphSpacing}px`,
    '--text-indent': `${layoutConfig.textIndent}em`,
    '--content-width': `${layoutConfig.contentWidth}px`,
    width: `${layoutConfig.contentWidth}px`,
    backgroundColor: theme.backgroundColor,
  };
}
