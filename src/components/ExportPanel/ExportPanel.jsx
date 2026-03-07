import { useState } from 'react';
import { exportPNG, exportPDF } from '../../utils/imageExporter';
import { splitImage, downloadSlices, RATIOS } from '../../utils/imageSplitter';
import styles from './ExportPanel.module.css';

/**
 * ExportPanel - handles exporting articles as PNG, PDF, or split long-images.
 */
export default function ExportPanel({ previewRef }) {
  const [ratio, setRatio] = useState('9:16');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  async function withLoading(label, fn) {
    setLoading(true);
    setStatus(`正在${label}...`);
    try {
      await fn();
      setStatus(`${label}完成！`);
    } catch (err) {
      setStatus(`${label}失败：${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleExportPNG() {
    await withLoading('导出 PNG', () => exportPNG(previewRef.current, 'article.png'));
  }

  async function handleExportPDF() {
    await withLoading('导出 PDF', () => exportPDF(previewRef.current, 'article.pdf'));
  }

  async function handleSplit() {
    await withLoading('切割长图', async () => {
      const slices = await splitImage(previewRef.current, ratio);
      downloadSlices(slices, 'article');
    });
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>导出</h3>

      <div className={styles.group}>
        <button
          className={styles.btn}
          onClick={handleExportPNG}
          disabled={loading}
        >
          导出 PNG
        </button>
        <button
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={handleExportPDF}
          disabled={loading}
        >
          导出 PDF
        </button>
      </div>

      <div className={styles.divider} />

      <h4 className={styles.subtitle}>长图切割</h4>
      <div className={styles.group}>
        <label className={styles.label}>切割比例</label>
        <div className={styles.ratioGroup}>
          {RATIOS.map((r) => (
            <button
              key={r.value}
              className={`${styles.ratioBtn} ${ratio === r.value ? styles.ratioBtnActive : ''}`}
              onClick={() => setRatio(r.value)}
              disabled={loading}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <button
        className={`${styles.btn} ${styles.btnSplit}`}
        onClick={handleSplit}
        disabled={loading}
      >
        切割并下载
      </button>

      {status && (
        <div className={`${styles.status} ${loading ? styles.statusLoading : ''}`}>
          {status}
        </div>
      )}
    </div>
  );
}
