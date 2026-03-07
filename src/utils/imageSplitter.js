import { renderToCanvas } from './imageExporter';

/**
 * Supported aspect ratios for long-image splitting.
 */
export const RATIOS = [
  { label: '3:4', value: '3:4', w: 3, h: 4 },
  { label: '2:3', value: '2:3', w: 2, h: 3 },
  { label: '9:16', value: '9:16', w: 9, h: 16 },
];

/**
 * Safe block element tags to cut at.
 */
const SAFE_BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'PRE', 'HR', 'UL', 'OL']);

/**
 * Finds the nearest safe cut Y coordinate (top of a block element) at or before `targetY`.
 * @param {HTMLElement} container
 * @param {number} targetY - Y position relative to the container
 * @param {number} scale - canvas scale factor
 * @returns {number} safe cut Y (canvas pixels)
 */
function findSafeCutY(container, targetY, scale) {
  const containerRect = container.getBoundingClientRect();
  const elements = container.querySelectorAll(
    'p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, hr, ul, ol',
  );

  let bestY = 0;

  for (const el of elements) {
    if (!SAFE_BLOCK_TAGS.has(el.tagName)) continue;
    const rect = el.getBoundingClientRect();
    const elTop = (rect.top - containerRect.top) * scale;
    if (elTop <= targetY) {
      bestY = elTop;
    } else {
      break;
    }
  }

  return bestY;
}

/**
 * Splits a canvas into multiple slices according to the given aspect ratio,
 * avoiding cutting through text lines by snapping to block element boundaries.
 *
 * @param {HTMLElement} element - the preview DOM element
 * @param {string} ratio - ratio string, e.g. "9:16"
 * @returns {Promise<string[]>} array of PNG data URLs
 */
export async function splitImage(element, ratio) {
  const ratioObj = RATIOS.find((r) => r.value === ratio) || RATIOS[2];
  const canvas = await renderToCanvas(element);
  const W = canvas.width;
  const H = canvas.height;
  const scale = canvas.width / element.offsetWidth;

  const heightPerSlice = Math.round((W * ratioObj.h) / ratioObj.w);
  const imageCount = Math.ceil(H / heightPerSlice);
  const slices = [];
  let currentY = 0;

  for (let i = 0; i < imageCount; i++) {
    const idealEndY = currentY + heightPerSlice;

    // For the last slice, just take what's left
    let endY = Math.min(idealEndY, H);

    // For non-last slices, find a safe cut position
    if (idealEndY < H) {
      const safeY = findSafeCutY(element, idealEndY, scale);
      if (safeY > currentY) {
        endY = safeY;
      }
    }

    const sliceHeight = endY - currentY;
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = W;
    sliceCanvas.height = sliceHeight;
    const ctx = sliceCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, currentY, W, sliceHeight, 0, 0, W, sliceHeight);
    slices.push(sliceCanvas.toDataURL('image/png'));

    currentY = endY;
    if (currentY >= H) break;
  }

  return slices;
}

/**
 * Downloads all slices as separate PNG files.
 * @param {string[]} slices
 * @param {string} [basename='article']
 */
export function downloadSlices(slices, basename = 'article') {
  slices.forEach((dataUrl, i) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${basename}-${i + 1}.png`;
    link.click();
  });
}
