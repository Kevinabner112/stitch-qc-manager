/**
 * Helper to calculate percentage and status for inspections
 */
const calculateRates = (qInspected, qPassed, qRejected) => {
  const inspected = Number(qInspected) || 0;
  const passed = Number(qPassed) || 0;
  const rejected = Number(qRejected) || 0;

  const passRate = inspected > 0 ? Math.round((passed / inspected) * 100) : 0;
  const rejRate = inspected > 0 ? Math.round((rejected / inspected) * 100) : 0;

  let status = '✅ LULUS SEMPURNA (100%)';
  if (rejected > 0 || passRate < 100) {
    if (passRate >= 90) {
      status = `⚠️ LULUS BERSYARAT (${passRate}%)`;
    } else {
      status = `❌ REJECT / TIDAK LULUS (${passRate}%)`;
    }
  }

  return { inspected, passed, rejected, passRate, rejRate, status };
};

/**
 * Format single inspection report with clean border boxes
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
    `╔══════════════════════════════════╗`,
    `       📋 *LAPORAN INSPEKSI QC*`,
    `╚══════════════════════════════════╝`,
    ``,
    `┌─── 📌 *INFORMASI ITEM* ──────────`,
    `│ • *Tanggal*   : ${dateStr}`,
    `│ • *Supplier*  : ${item.supplier || '-'}`,
    `│ • *Item No*   : ${item.itemNo || '-'}`,
    `│ • *Nama Item* : ${item.itemName || '-'}`,
    `└──────────────────────────────────`,
    ``,
    `┌─── 📊 *HASIL INSPEKSI* ──────────`,
    `│ • *Inspected* : ${inspected} ${uom}`,
    `│ • *Passed*    : ${passed} ${uom} (${passRate}%)`,
    `│ • *Rejected*  : ${rejected} ${uom} (${rejRate}%)`,
    `│ • *Status*    : ${status}`,
    `└──────────────────────────────────`,
    ``,
    `┌─── 🏷️ *DEFECT & CATATAN* ────────`,
    `│ • *Kategori*  : ${item.defectCategory || '-'}`,
    `│ • *Catatan*   : ${item.notes || '-'}`,
    `└──────────────────────────────────`,
    ``,
    `════════════════════════════════════`,
    `_Stitch Enterprise Quality Control_`
  ].join('\n');
};

/**
 * Format bulk inspections report with individual framed cards
 */
export const formatBulkShareText = (selectedItems) => {
  const todayStr = new Date().toLocaleDateString('id-ID');
  
  const header = [
    `╔══════════════════════════════════╗`,
    `   📋 *REKAP LAPORAN INSPEKSI QC*`,
    `   🗓️ Tanggal: ${todayStr}`,
    `   📦 Total: ${selectedItems.length} Data Inspeksi`,
    `╚══════════════════════════════════╝`,
    ``
  ].join('\n');

  const itemsFormatted = selectedItems.map((item, index) => {
    const dateStr = item.date || new Date(item.createdAt || Date.now()).toLocaleDateString('id-ID');
    const uom = item.uom || 'Pcs';
    const { inspected, passed, rejected, passRate, rejRate, status } = calculateRates(
      item.qInspected,
      item.qPassed,
      item.qRejected
    );

    return [
      `┏━━━ 📌 *ITEM #${index + 1}* ━━━━━━━━━━━━━━━━━`,
      `┃ • *Tanggal*   : ${dateStr}`,
      `┃ • *Supplier*  : ${item.supplier || '-'}`,
      `┃ • *Item*      : ${item.itemNo || '-'} - ${item.itemName || 'N/A'}`,
      `┃ • *Inspected* : ${inspected} ${uom}`,
      `┃ • *Passed*    : ${passed} ${uom} (${passRate}%)`,
      `┃ • *Rejected*  : ${rejected} ${uom} (${rejRate}%)`,
      `┃ • *Status*    : ${status}`,
      `┃ • *Defect*    : ${item.defectCategory || '-'}`,
      `┃ • *Catatan*   : ${item.notes || '-'}`,
      `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    ].join('\n');
  }).join('\n\n');

  const footer = [
    ``,
    `════════════════════════════════════`,
    `_Stitch Enterprise Quality Control_`
  ].join('\n');

  return `${header}${itemsFormatted}${footer}`;
};
