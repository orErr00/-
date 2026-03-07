/**
 * Calculates word count and reading time from text.
 * @param {string} text
 * @returns {{ wordCount: number, readingMinutes: number }}
 */
export function calcReadingInfo(text) {
  const wordCount = text.length;
  const readingMinutes = Math.ceil(wordCount / 300);
  return { wordCount, readingMinutes };
}

/**
 * Formats reading info as a display string.
 * @param {number} wordCount
 * @param {number} readingMinutes
 * @returns {string}
 */
export function formatReadingInfo(wordCount, readingMinutes) {
  return `全文 ${wordCount} 字 · 阅读约 ${readingMinutes} 分钟`;
}
