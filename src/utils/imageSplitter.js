/**
 * Split a large image (canvas) into multiple smaller images
 * for easier sharing or multi-page export.
 */

export function splitImage(canvas, maxHeight = 1200) {
  const width = canvas.width
  const totalHeight = canvas.height

  if (totalHeight <= maxHeight) {
    return [canvas.toDataURL('image/png')]
  }

  const parts = []
  let y = 0

  while (y < totalHeight) {
    const sliceHeight = Math.min(maxHeight, totalHeight - y)
    const partCanvas = document.createElement('canvas')
    partCanvas.width = width
    partCanvas.height = sliceHeight
    const ctx = partCanvas.getContext('2d')
    ctx.drawImage(canvas, 0, y, width, sliceHeight, 0, 0, width, sliceHeight)
    parts.push(partCanvas.toDataURL('image/png'))
    y += sliceHeight
  }

  return parts
}
