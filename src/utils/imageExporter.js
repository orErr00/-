import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Renders a DOM element to a canvas using html2canvas.
 * @param {HTMLElement} element
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderToCanvas(element) {
  return html2canvas(element, {
    useCORS: true,
    allowTaint: false,
    scale: 2,
    backgroundColor: null,
    logging: false,
  });
}

/**
 * Triggers a file download.
 * @param {string} dataUrl
 * @param {string} filename
 */
function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

/**
 * Exports the given element as a PNG image.
 * @param {HTMLElement} element
 * @param {string} [filename='article.png']
 */
export async function exportPNG(element, filename = 'article.png') {
  const canvas = await renderToCanvas(element);
  const dataUrl = canvas.toDataURL('image/png');
  downloadDataUrl(dataUrl, filename);
}

/**
 * Exports the given element as a PDF file using html2canvas + jsPDF.
 * @param {HTMLElement} element
 * @param {string} [filename='article.pdf']
 */
export async function exportPDF(element, filename = 'article.pdf') {
  const canvas = await renderToCanvas(element);
  const imgData = canvas.toDataURL('image/png');
  const pxToMm = 0.264583;
  const pdfWidth = canvas.width * pxToMm;
  const pdfHeight = canvas.height * pxToMm;
  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pdfWidth, pdfHeight],
  });
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
}
