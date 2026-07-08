/* ============ Konstanta ============ */
const HARI = [
  { key: 'SENIN', label: 'Senin' },
  { key: 'SELASA', label: 'Selasa' },
  { key: 'RABU', label: 'Rabu' },
  { key: 'KAMIS', label: 'Kamis' },
  { key: 'JUMAT', label: 'Jumat' },
];

const KATEGORI = [
  { key: 'MAKANAN POKOK', label: 'Makanan Pokok' },
  { key: 'LAUK HEWANI', label: 'Lauk Hewani' },
  { key: 'LAUK NABATI', label: 'Lauk Nabati' },
  { key: 'SAYUR', label: 'Sayur' },
  { key: 'BUAH', label: 'Buah' },
];

const SPPG_NAME = 'SPPG PEMALANG MULYOHARJO 4';
const STORAGE_KEY = 'sppg_menu_draft_v1';

const FORM_META = {
  belanja: {
    title: 'FORM PERMINTAAN BELANJA BAHAN BAKU',
    filePrefix: 'Form_Permintaan_Belanja',
    roleLabel: 'Petugas Belanja',
    columns: ['No', 'Hidangan', 'Bahan', 'Jml Kebutuhan', 'Satuan', 'Jml Order', 'Satuan', 'Harga (Rp)', 'Total (Rp)', 'Keterangan'],
    rowToArray: r => [r.no, r.hidangan, r.bahan, '', '', '', '', '', '', ''],
    includeTambahan: true,
  },
  persiapan: {
    title: 'FORM PERSIAPAN BAHAN',
    filePrefix: 'Form_Persiapan',
    roleLabel: 'Petugas Persiapan',
    columns: ['No', 'Hidangan', 'Bahan yang Disiapkan', 'Cuci', 'Potong', 'Timbang', 'Keterangan'],
    rowToArray: r => [r.no, r.hidangan, r.bahan, '\u2610', '\u2610', '\u2610', ''],
    includeTambahan: true,
  },
  pengolahan: {
    title: 'FORM PENGOLAHAN (SOP MASAK)',
    filePrefix: 'Form_Pengolahan',
    roleLabel: 'Petugas Pengolahan (Juru Masak)',
    columns: ['No', 'Hidangan', 'Bahan Utama', 'Instruksi Pengolahan', 'Paraf'],
    rowToArray: r => [r.no, r.hidangan, r.bahan, '', ''],
    includeTambahan: false,
  },
  pemorsian: {
    title: 'FORM PEMORSIAN',
    filePrefix: 'Form_Pemorsian',
    roleLabel: 'Petugas Pemorsian',
    columns: ['No', 'Hidangan', 'Balita', 'Kecil', 'Besar', 'B2', 'Paraf'],
    rowToArray: r => [r.no, r.hidangan, '', '', '', '', ''],
    includeTambahan: false,
  },
};

/* ============ State ============ */
function defaultState() {
  const hari = {};
  HARI.forEach(h => {
    const items = {};
    KATEGORI.forEach(k => { items[k.key] = { bahan: '', hidangan: '' }; });
    hari[h.key] = { items, tambahan: '' };
  });
  return { mingguKe: '', tanggalSenin: '', hari };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const base = defaultState();
      base.mingguKe = parsed.mingguKe || '';
      base.tanggalSenin = parsed.tanggalSenin || '';
      HARI.forEach(h => {
        if (parsed.hari && parsed.hari[h.key]) {
          KATEGORI.forEach(k => {
            const item = parsed.hari[h.key].items && parsed.hari[h.key].items[k.key];
            if (item) base.hari[h.key].items[k.key] = { bahan: item.bahan || '', hidangan: item.hidangan || '' };
          });
          base.hari[h.key].tambahan = parsed.hari[h.key].tambahan || '';
        }
      });
      return base;
    }
  } catch (e) { /* ignore corrupt draft */ }
  return defaultState();
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
}

let state = loadState();

/* ============ Tanggal ============ */
function computeDateStr(offset) {
  if (!state.tanggalSenin) return '';
  const d = new Date(state.tanggalSenin + 'T00:00:00');
  d.setDate(d.getDate() + offset);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/* ============ Render UI ============ */
function renderTabs() {
  const tabsEl = document.getElementById('dayTabs');
  const panelsEl = document.getElementById('dayPanels');
  tabsEl.innerHTML = '';
  panelsEl.innerHTML = '';

  HARI.forEach((h, idx) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'day-tab' + (idx === 0 ? ' active' : '');
    tab.dataset.day = h.key;
    tab.innerHTML = `${h.label}<span class="d-date">${computeDateStr(idx)}</span>`;
    tab.addEventListener('click', () => switchDay(h.key));
    tabsEl.appendChild(tab);

    const panel = document.createElement('div');
    panel.className = 'day-panel' + (idx === 0 ? ' active' : '');
    panel.dataset.day = h.key;
    panel.appendChild(buildDayTable(h.key, idx));
    panelsEl.appendChild(panel);
  });

  // satu listener paste untuk seluruh minggu, biar bisa tempel lintas hari sekaligus
  panelsEl.addEventListener('paste', e => handleWeekPaste(e));
}

function updateTabDates() {
  document.querySelectorAll('.day-tab').forEach((tab, idx) => {
    const span = tab.querySelector('.d-date');
    if (span) span.textContent = computeDateStr(idx);
  });
}

function switchDay(dayKey) {
  document.querySelectorAll('.day-tab').forEach(t => t.classList.toggle('active', t.dataset.day === dayKey));
  document.querySelectorAll('.day-panel').forEach(p => p.classList.toggle('active', p.dataset.day === dayKey));
}

function buildDayTable(dayKey, dayIndex) {
  const container = document.createElement('div');

  const table = document.createElement('table');
  table.className = 'menu-table';
  table.innerHTML = '<thead><tr><th>Kategori</th><th>Bahan</th><th>Hidangan</th></tr></thead>';
  const tbody = document.createElement('tbody');

  KATEGORI.forEach((kat, rowIndex) => {
    const tr = document.createElement('tr');

    const tdKat = document.createElement('td');
    tdKat.textContent = kat.label;

    const tdBahan = document.createElement('td');
    const inputBahan = document.createElement('input');
    inputBahan.type = 'text';
    inputBahan.placeholder = 'contoh: Ayam Fillet';
    inputBahan.value = state.hari[dayKey].items[kat.key].bahan;
    inputBahan.dataset.dayIndex = String(dayIndex);
    inputBahan.dataset.rowIndex = String(rowIndex);
    inputBahan.dataset.field = 'bahan';
    inputBahan.addEventListener('input', e => {
      state.hari[dayKey].items[kat.key].bahan = e.target.value;
      saveState();
    });
    tdBahan.appendChild(inputBahan);

    const tdHid = document.createElement('td');
    const inputHid = document.createElement('input');
    inputHid.type = 'text';
    inputHid.placeholder = 'contoh: Ayam Katsu';
    inputHid.value = state.hari[dayKey].items[kat.key].hidangan;
    inputHid.dataset.dayIndex = String(dayIndex);
    inputHid.dataset.rowIndex = String(rowIndex);
    inputHid.dataset.field = 'hidangan';
    inputHid.addEventListener('input', e => {
      state.hari[dayKey].items[kat.key].hidangan = e.target.value;
      saveState();
    });
    tdHid.appendChild(inputHid);

    tr.append(tdKat, tdBahan, tdHid);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);

  const label = document.createElement('label');
  label.textContent = 'Bahan tambahan / bumbu (satu bahan per baris)';
  const textarea = document.createElement('textarea');
  textarea.value = state.hari[dayKey].tambahan;
  textarea.placeholder = 'Bawang merah\nBawang putih\nMinyak goreng';
  textarea.addEventListener('input', e => {
    state.hari[dayKey].tambahan = e.target.value;
    saveState();
  });
  container.appendChild(label);
  container.appendChild(textarea);

  return container;
}

/**
 * Tempel (paste) data dari file Buku Menu (sheet SIKLUS MENU) langsung ke web.
 * Format sumbernya tetap: 5 baris kategori (Makanan Pokok, Lauk Hewani, Lauk Nabati,
 * Sayur, Buah) x kolom berpasangan Bahan-Hidangan per hari (Senin, Selasa, ...).
 *
 * Klik kotak Bahan di hari & kategori mana pun sebagai titik awal, lalu paste.
 * Data menyebar ke bawah (kategori) dan ke samping (Bahan → Hidangan → hari berikutnya)
 * persis mengikuti susunan sel yang di-copy dari Excel — jadi satu minggu penuh
 * (10 kolom: Bahan-Hidangan x Senin-Jumat) bisa ditempel sekaligus dalam satu paste.
 */
function handleWeekPaste(e) {
  const target = e.target;
  if (!target.matches('input[type="text"]') || target.dataset.dayIndex === undefined) return;

  const text = (e.clipboardData || window.clipboardData).getData('text');
  if (!text || !/\t|\n/.test(text)) return; // paste satu nilai saja, biarkan perilaku default

  e.preventDefault();

  const startDay = parseInt(target.dataset.dayIndex, 10);
  const startRow = parseInt(target.dataset.rowIndex, 10);
  const startFieldCol = target.dataset.field === 'bahan' ? 0 : 1;
  const startAbsCol = startDay * 2 + startFieldCol;

  const rows = text.replace(/\r/g, '').split('\n')
    .filter((row, idx, arr) => !(idx === arr.length - 1 && row === ''));

  rows.forEach((rowStr, i) => {
    const rIdx = startRow + i;
    if (rIdx >= KATEGORI.length) return; // di luar 5 kategori, diabaikan
    const katKey = KATEGORI[rIdx].key;
    const cols = rowStr.split('\t');
    cols.forEach((val, j) => {
      const absCol = startAbsCol + j;
      const dayIdx = Math.floor(absCol / 2);
      if (dayIdx >= HARI.length) return; // lewat Jumat (misal ikut ke-copy kolom Sabtu), diabaikan
      const field = absCol % 2 === 0 ? 'bahan' : 'hidangan';
      const dayKey = HARI[dayIdx].key;
      const cleanVal = val.trim();
      state.hari[dayKey].items[katKey][field] = cleanVal;
      const inputEl = document.querySelector(
        `input[data-day-index="${dayIdx}"][data-row-index="${rIdx}"][data-field="${field}"]`
      );
      if (inputEl) inputEl.value = cleanVal;
    });
  });

  saveState();
  showToast('Menu berhasil ditempel.');
}

/* ============ Bangun baris data per form ============ */
function buildRows(formKey, dayState) {
  const rows = [];
  let no = 1;
  KATEGORI.forEach(kat => {
    const item = dayState.items[kat.key];
    const bahan = (item.bahan || '').trim();
    const hidangan = (item.hidangan || '').trim();
    if (bahan || hidangan) {
      rows.push({ no: no++, hidangan: hidangan || '-', bahan: bahan || '-' });
    }
  });
  if (FORM_META[formKey].includeTambahan) {
    (dayState.tambahan || '').split('\n').map(s => s.trim()).filter(Boolean).forEach(line => {
      rows.push({ no: no++, hidangan: '-', bahan: line });
    });
  }
  return rows;
}

function buildDaysData(formKey) {
  return HARI.map((h, idx) => ({
    dayKey: h.key,
    dayLabel: h.label,
    dateStr: computeDateStr(idx),
    rows: buildRows(formKey, state.hari[h.key]),
  }));
}

/* ============ Helper umum ============ */
function letterheadLines(title, day) {
  return [
    'BADAN GIZI NASIONAL REPUBLIK INDONESIA',
    'Satuan Pelayanan Pemenuhan Gizi (SPPG)',
    SPPG_NAME,
    '',
    title,
    `Minggu ke- ${state.mingguKe || '-'}   |   Hari: ${day.dayLabel}   |   Tanggal: ${day.dateStr || '-'}`,
  ];
}

function downloadBlob(data, filename, mime) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ============ Excel (ExcelJS) ============ */
function colLetter(n) {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function borderAll() {
  return {
    top: { style: 'thin', color: { argb: 'FFB9B49A' } },
    left: { style: 'thin', color: { argb: 'FFB9B49A' } },
    bottom: { style: 'thin', color: { argb: 'FFB9B49A' } },
    right: { style: 'thin', color: { argb: 'FFB9B49A' } },
  };
}

function writeLetterhead(ws, title, day, colCount) {
  const lastCol = colLetter(colCount);
  const lines = letterheadLines(title, day);
  lines.forEach((line, i) => {
    const rowIdx = i + 1;
    ws.mergeCells(`A${rowIdx}:${lastCol}${rowIdx}`);
    const cell = ws.getCell(`A${rowIdx}`);
    cell.value = line;
    cell.alignment = { horizontal: 'center' };
    if (i === 0 || i === 2) cell.font = { bold: true, size: 12 };
    else if (i === 4) cell.font = { bold: true, size: 13, underline: true };
    else cell.font = { size: 10 };
  });
  return lines.length + 2; // baris kosong setelah kop, siap untuk tabel
}

function writeTable(ws, columns, bodyArrays, startRow) {
  const headerRow = ws.getRow(startRow);
  columns.forEach((c, i) => { headerRow.getCell(i + 1).value = c; });
  headerRow.eachCell(cell => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = borderAll();
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE4EEE6' } };
  });

  bodyArrays.forEach((arr, idx) => {
    const row = ws.getRow(startRow + 1 + idx);
    arr.forEach((val, i) => {
      const cell = row.getCell(i + 1);
      cell.value = val;
      cell.border = borderAll();
      cell.alignment = { vertical: 'middle', wrapText: true, horizontal: i === 0 ? 'center' : 'left' };
    });
  });

  columns.forEach((c, i) => {
    const col = ws.getColumn(i + 1);
    if (i === 0) col.width = 6;
    else if (c.toLowerCase().includes('hidangan')) col.width = 24;
    else if (c.toLowerCase().includes('bahan')) col.width = 26;
    else if (c.toLowerCase().includes('instruksi')) col.width = 40;
    else col.width = 14;
  });

  return startRow + 1 + bodyArrays.length;
}

function writeSignature(ws, startRow, colCount, roleLabel) {
  const lastCol = colLetter(colCount);
  const leftSpan = Math.max(1, Math.ceil(colCount / 2));
  const rightStart = leftSpan + 1;

  const r1 = startRow + 2;
  ws.mergeCells(`A${r1}:${lastCol}${r1}`);
  ws.getCell(`A${r1}`).value = 'Mengetahui,';
  ws.getCell(`A${r1}`).alignment = { horizontal: 'right' };

  const r2 = r1 + 1;
  ws.mergeCells(`A${r2}:${colLetter(leftSpan)}${r2}`);
  ws.getCell(`A${r2}`).value = roleLabel;
  ws.getCell(`A${r2}`).alignment = { horizontal: 'center' };
  if (rightStart <= colCount) {
    ws.mergeCells(`${colLetter(rightStart)}${r2}:${lastCol}${r2}`);
    ws.getCell(`${colLetter(rightStart)}${r2}`).value = 'Kepala SPPG';
    ws.getCell(`${colLetter(rightStart)}${r2}`).alignment = { horizontal: 'center' };
  }

  const r3 = r2 + 4;
  ws.mergeCells(`A${r3}:${colLetter(leftSpan)}${r3}`);
  ws.getCell(`A${r3}`).value = '(____________________)';
  ws.getCell(`A${r3}`).alignment = { horizontal: 'center' };
  if (rightStart <= colCount) {
    ws.mergeCells(`${colLetter(rightStart)}${r3}:${lastCol}${r3}`);
    ws.getCell(`${colLetter(rightStart)}${r3}`).value = '(____________________)';
    ws.getCell(`${colLetter(rightStart)}${r3}`).alignment = { horizontal: 'center' };
  }
}

async function generateXlsx(meta, daysData) {
  const wb = new ExcelJS.Workbook();
  daysData.forEach(day => {
    if (day.rows.length === 0) return;
    const ws = wb.addWorksheet(day.dayLabel);
    const colCount = meta.columns.length;
    const tableStart = writeLetterhead(ws, meta.title, day, colCount);
    const bodyArrays = day.rows.map(r => meta.rowToArray(r));
    const afterTable = writeTable(ws, meta.columns, bodyArrays, tableStart);
    writeSignature(ws, afterTable, colCount, meta.roleLabel);
  });

  if (wb.worksheets.length === 0) {
    showToast('Tidak ada data untuk diekspor.');
    return;
  }
  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(
    buf,
    `${meta.filePrefix}_Minggu${state.mingguKe || '-'}.xlsx`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}

/* ============ PDF (jsPDF + autotable) ============ */
function drawLetterheadPdf(doc, title, day) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const cx = pageWidth / 2;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text('BADAN GIZI NASIONAL REPUBLIK INDONESIA', cx, 40, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
  doc.text('Satuan Pelayanan Pemenuhan Gizi (SPPG)', cx, 54, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(SPPG_NAME, cx, 68, { align: 'center' });
  doc.setDrawColor(43, 93, 78); doc.setLineWidth(1);
  doc.line(40, 78, pageWidth - 40, 78);
  doc.setFontSize(12);
  doc.text(title, cx, 98, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
  doc.text(`Minggu ke- ${state.mingguKe || '-'}   |   Hari: ${day.dayLabel}   |   Tanggal: ${day.dateStr || '-'}`, cx, 114, { align: 'center' });
}

function drawSignaturePdf(doc, y, roleLabel) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
  doc.text('Mengetahui,', pageWidth - 40, y, { align: 'right' });
  y += 40;
  const leftX = pageWidth * 0.28;
  const rightX = pageWidth * 0.72;
  doc.text(roleLabel, leftX, y, { align: 'center' });
  doc.text('Kepala SPPG', rightX, y, { align: 'center' });
  y += 45;
  doc.text('(____________________)', leftX, y, { align: 'center' });
  doc.text('(____________________)', rightX, y, { align: 'center' });
}

function generatePdf(meta, daysData) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let usedFirstPage = false;

  daysData.forEach(day => {
    if (day.rows.length === 0) return;
    if (usedFirstPage) doc.addPage();
    usedFirstPage = true;

    drawLetterheadPdf(doc, meta.title, day);
    doc.autoTable({
      startY: 128,
      head: [meta.columns],
      body: day.rows.map(r => meta.rowToArray(r)),
      styles: { fontSize: 8.5, cellPadding: 5, valign: 'middle', lineColor: [220, 216, 198], lineWidth: 0.5 },
      headStyles: { fillColor: [43, 93, 78], textColor: 255, fontStyle: 'bold', halign: 'center' },
      margin: { left: 40, right: 40 },
      theme: 'grid',
    });

    let finalY = doc.lastAutoTable.finalY + 36;
    const pageHeight = doc.internal.pageSize.getHeight();
    if (finalY > pageHeight - 90) {
      doc.addPage();
      finalY = 60;
    }
    drawSignaturePdf(doc, finalY, meta.roleLabel);
  });

  if (!usedFirstPage) {
    showToast('Tidak ada data untuk diekspor.');
    return;
  }
  doc.save(`${meta.filePrefix}_Minggu${state.mingguKe || '-'}.pdf`);
}

/* ============ Ekspor utama ============ */
async function exportForm(formKey, format) {
  const meta = FORM_META[formKey];
  const daysData = buildDaysData(formKey);
  const hasAnyData = daysData.some(d => d.rows.length > 0);
  if (!hasAnyData) {
    showToast('Isi menu minimal satu hari dulu, ya.');
    return;
  }
  if (format === 'xlsx') await generateXlsx(meta, daysData);
  else generatePdf(meta, daysData);
}

/* ============ Init ============ */
function init() {
  document.getElementById('mingguKe').value = state.mingguKe || '';
  document.getElementById('tanggalSenin').value = state.tanggalSenin || '';

  document.getElementById('mingguKe').addEventListener('input', e => {
    state.mingguKe = e.target.value;
    saveState();
  });
  document.getElementById('tanggalSenin').addEventListener('change', e => {
    state.tanggalSenin = e.target.value;
    saveState();
    updateTabDates();
  });

  renderTabs();

  document.querySelectorAll('button[data-form]').forEach(btn => {
    btn.addEventListener('click', () => exportForm(btn.dataset.form, btn.dataset.format));
  });
}

init();
