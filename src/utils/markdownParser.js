import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: false,
});

/**
 * Parses Markdown text to HTML string.
 * @param {string} text
 * @returns {string}
 */
export function parseMarkdown(text) {
  return md.render(text);
}
