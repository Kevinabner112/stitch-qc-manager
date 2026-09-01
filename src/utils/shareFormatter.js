/**
 * Helper to calculate percentage and status for inspections
 */
const calculateRates = (qInspected, qPassed, qRejected) => {
  const inspected = Number(qInspected) || 0;
  const passed = Number(qPassed) || 0;
  const rejected = Number(qRejected) || 0;

  const passRate = inspected > 0 ? Math.round((passed / inspected) * 100) : 0;
  const rejRate = inspected > 0 ? Math.round((rejected / inspected) * 100) : 0;

  let status = '✅ Lulus Sempurna (100%)';
  if (rejected > 0 || passRate < 100) {
    if (passRate >= 90) {
      status = `⚠️ Lulus Bersyarat (${passRate}%)`;
    } else {
      status = `❌ Reject / Tidak Lulus (${passRate}%)`;
    }
  }

  return { inspected, passed, rejected, passRate, rejRate, status };
};

const BORDER_LINE = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
const ITEM_DIVIDER = '────────────────────────────────';

/**
 * Format single inspection report with top and bottom border only
 */
export const formatSingleShareText = (item) => {
  const dateStr = item.date || new Date(item.createdAt || Date.now()).toLocaleDateString('id-ID');
  const uom = item.uom || 'Pcs';
  const { inspected, passed, rejected, passRate, rejRate, status } = calculateRates(
    item.qInspected,
    item.qPassed,
    item.qRejected
  );

  return [
    BORDER_LINE,
    `*Laporan Inspeksi QC*`,
    ``,
    `Tanggal: ${dateStr}`,
    `Supplier: ${item.supplier || '-'}`,
    `Item: ${item.itemNo || '-'} - ${item.itemName || 'N/A'}`,
    ``,
    `*Hasil*`,
    `Inspected: ${inspected} ${uom}`,
    `Passed: ${passed} ${uom} (${passRate}%)`,
    `Rejected: ${rejected} ${uom} (${rejRate}%)`,
    `Status: ${status}`,
    ``,
    `*Kategori Defect*: ${item.defectCategory || '-'}`,
    `*Catatan*: ${item.notes || '-'}`,
    BORDER_LINE
  ].join('\n');
};

/**
 * Format bulk inspections report with clean top and bottom borders
 */
export const formatBulkShareText = (selectedItems) => {
  const itemsFormatted = selectedItems.map((item, index) => {
    const dateStr = item.date || new Date(item.createdAt || Date.now()).toLocaleDateString('id-ID');
    const uom = item.uom || 'Pcs';
    const { inspected, passed, rejected, passRate, rejRate, status } = calculateRates(
      item.qInspected,
      item.qPassed,
      item.qRejected
    );

    return [
      `*Laporan Inspeksi QC #${index + 1}*`,
      `Tanggal: ${dateStr}`,
      `Supplier: ${item.supplier || '-'}`,
      `Item: ${item.itemNo || '-'} - ${item.itemName || 'N/A'}`,
      ``,
      `*Hasil*`,
      `Inspected: ${inspected} ${uom}`,
      `Passed: ${passed} ${uom} (${passRate}%)`,
      `Rejected: ${rejected} ${uom} (${rejRate}%)`,
      `Status: ${status}`,
      ``,
      `*Kategori Defect*: ${item.defectCategory || '-'}`,
      `*Catatan*: ${item.notes || '-'}`
    ].join('\n');
  }).join(`\n\n${ITEM_DIVIDER}\n\n`);

  return [
    BORDER_LINE,
    itemsFormatted,
    BORDER_LINE
  ].join('\n');
};
