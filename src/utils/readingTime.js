/**
 * Estimate reading time for given text content.
 * Assumes average Chinese reading speed of ~400 characters/minute
 * and English reading speed of ~200 words/minute.
 */

export function getReadingTime(text) {
  if (!text) return 0

  // Count Chinese characters
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  // Count English words
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length

  const minutes = chineseChars / 400 + englishWords / 200
  return Math.max(1, Math.ceil(minutes))
}
