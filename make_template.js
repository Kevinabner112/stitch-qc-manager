const xl = require('excel4node');
const fs = require('fs');
const path = require('path');

const wb = new xl.Workbook();

// Sheet 1: Dashboard Title & Info
const wsDash = wb.addWorksheet('QC_Dashboard');
const titleStyle = wb.createStyle({
  font: { size: 16, bold: true, color: '#0284C7' }
});
wsDash.cell(1, 1).string('QUALITY CONTROL DASHBOARD REPORT').style(titleStyle);
wsDash.cell(2, 1).string('Native Dynamic Excel Report & Analytics');

// Sheet 2: Inspection Data
const wsData = wb.addWorksheet('Inspection_Data');

const headerStyle = wb.createStyle({
  font: { bold: true, color: '#FFFFFF' },
  fill: { type: 'pattern', patternType: 'solid', fgColor: '#0284C7' },
  alignment: { horizontal: 'center' }
});

const headers = ["ID", "Date", "Supplier", "Item", "Qty Received", "Qty Inspected", "Qty Passed", "Qty Rejected", "Defect Category", "Notes"];
headers.forEach((h, i) => {
  wsData.cell(1, i + 1).string(h).style(headerStyle);
});

// Seed Initial Rows
const sampleData = [
  ["INS-001", "2026-08-01", "Apex Industrial Materials", "ITM-1001", 100, 100, 95, 5, "Crack/Fracture", "Minor defect"],
  ["INS-002", "2026-08-02", "Global Tech Components", "ITM-1002", 200, 200, 198, 2, "Dimension NG", "Passed testing"],
  ["INS-003", "2026-08-03", "Nexus Fabrication", "ITM-1001", 150, 150, 140, 10, "Crack/Fracture", "High reject"],
];

sampleData.forEach((row, rowIndex) => {
  row.forEach((val, colIndex) => {
    if (typeof val === 'number') {
      wsData.cell(rowIndex + 2, colIndex + 1).number(val);
    } else {
      wsData.cell(rowIndex + 2, colIndex + 1).string(val);
    }
  });
});

const outputDir = path.join(__dirname, 'public');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'template_qc_dashboard.xlsx');
wb.write(outputPath, (err) => {
  if (err) {
    console.error('Error writing template:', err);
  } else {
    console.log('Template created successfully at:', outputPath);
  }
});
