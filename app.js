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
const STORAGE_KEY = 'sppg_menu_draft_v2';

function fmtGram(val, satuan) {
  const v = (val || '').toString().trim();
  if (!v) return '';
  const s = (satuan || '').toString().trim();
  return s ? `${v} ${s}` : v;
}

const FORM_META = {
  belanja: {
    title: 'FORM PERMINTAAN BELANJA BAHAN BAKU',
    filePrefix: 'Form_Permintaan_Belanja',
    roleLabel: 'Petugas Belanja',
    columns: ['No', 'Hidangan', 'Bahan', 'Jml Kebutuhan', 'Satuan', 'Jml Order', 'Satuan', 'Harga (Rp)', 'Total (Rp)', 'Keterangan'],
    rowToArray: r => [r.no, r.hidangan, r.bahan, '', r.satuan || '', '', '', '', '', r.keterangan || ''],
    includeTambahan: true,
  },
  persiapan: {
    title: 'FORM PERSIAPAN BAHAN',
    filePrefix: 'Form_Persiapan',
    roleLabel: 'Petugas Persiapan',
    columns: ['No', 'Hidangan', 'Bahan yang Disiapkan', 'Cuci', 'Potong', 'Timbang', 'Keterangan / Takaran'],
    rowToArray: r => {
      const gramInfo = [
        r.gramasi.balita ? `Balita ${fmtGram(r.gramasi.balita, r.satuan)}` : '',
        r.gramasi.kecil ? `Kecil ${fmtGram(r.gramasi.kecil, r.satuan)}` : '',
        r.gramasi.besar ? `Besar ${fmtGram(r.gramasi.besar, r.satuan)}` : '',
        r.gramasi.b2 ? `B2 ${fmtGram(r.gramasi.b2, r.satuan)}` : '',
      ].filter(Boolean).join(' | ');
      const ket = [gramInfo, r.keterangan || ''].filter(Boolean).join(' — ');
      return [r.no, r.hidangan, r.bahan, '\u2610', '\u2610', '\u2610', ket];
    },
    includeTambahan: true,
  },
  pengolahan: {
    title: 'FORM PENGOLAHAN (SOP MASAK)',
    filePrefix: 'Form_Pengolahan',
    roleLabel: 'Petugas Pengolahan (Juru Masak)',
    columns: ['No', 'Hidangan', 'Bahan Utama', 'Instruksi Pengolahan', 'Paraf'],
    rowToArray: r => [r.no, r.hidangan, r.bahan, r.instruksi || '', ''],
    includeTambahan: false,
  },
  pemorsian: {
    title: 'FORM PEMORSIAN',
    filePrefix: 'Form_Pemorsian',
    roleLabel: 'Petugas Pemorsian',
    columns: ['No', 'Hidangan', 'Balita', 'Kecil', 'Besar', 'B2', 'Paraf'],
    rowToArray: r => [
      r.no, r.hidangan,
      fmtGram(r.gramasi.balita, r.satuan),
      fmtGram(r.gramasi.kecil, r.satuan),
      fmtGram(r.gramasi.besar, r.satuan),
      fmtGram(r.gramasi.b2, r.satuan),
      '',
    ],
    includeTambahan: false,
  },
};

/* ============ State ============ */
function emptyItem() {
  return { bahan: '', hidangan: '', instruksi: '', gramasi: { balita: '', kecil: '', besar: '', b2: '' }, satuan: '', keterangan: '' };
}

function defaultState() {
  const hari = {};
  HARI.forEach(h => {
    const items = {};
    KATEGORI.forEach(k => { items[k.key] = emptyItem(); });
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
        const savedDay = parsed.hari && parsed.hari[h.key];
        if (savedDay) {
          KATEGORI.forEach(k => {
            const item = savedDay.items && savedDay.items[k.key];
            if (item) {
              base.hari[h.key].items[k.key] = {
                bahan: item.bahan || '',
                hidangan: item.hidangan || '',
                instruksi: item.instruksi || '',
                gramasi: {
                  balita: (item.gramasi && item.gramasi.balita) || '',
                  kecil: (item.gramasi && item.gramasi.kecil) || '',
                  besar: (item.gramasi && item.gramasi.besar) || '',
                  b2: (item.gramasi && item.gramasi.b2) || '',
                },
                satuan: item.satuan || '',
                keterangan: item.keterangan || '',
              };
            }
          });
          base.hari[h.key].tambahan = savedDay.tambahan || '';
        }
      });
      return base;
    }
  } catch (e) { /* draf rusak/tidak ada, pakai default */ }
  return defaultState();
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage tidak tersedia */ }
}

let state = loadState();

function setItemField(dayKey, katKey, field, value) {
  const item = state.hari[dayKey].items[katKey];
  if (field.startsWith('gramasi')) {
    const sub = field.slice('gramasi'.length).toLowerCase();
    item.gramasi[sub] = value;
  } else {
    item[field] = value;
  }
}

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

  panelsEl.addEventListener('paste', e => handlePaste(e));
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

function makeCellInput({ dayKey, katKey, rowIndex, dayIndex, field, value, placeholder, type, extraClass }) {
  const el = document.createElement(type === 'textarea' ? 'textarea' : 'input');
  if (type !== 'textarea') el.type = 'text';
  if (extraClass) el.className = extraClass;
  el.placeholder = placeholder || '';
  el.value = value || '';
  el.dataset.dayIndex = String(dayIndex);
  el.dataset.rowIndex = String(rowIndex);
  el.dataset.field = field;
  el.addEventListener('input', e => {
    setItemField(dayKey, katKey, field, e.target.value);
    saveState();
  });
  return el;
}

function buildDayTable(dayKey, dayIndex) {
  const container = document.createElement('div');
  const scroller = document.createElement('div');
  scroller.className = 'table-scroll';

  const table = document.createElement('table');
  table.className = 'menu-table wide';
  table.innerHTML = `<thead><tr>
    <th>Kategori</th><th>Bahan</th><th>Hidangan</th><th>Instruksi Pengolahan</th>
    <th>Gr. Balita</th><th>Gr. Kecil</th><th>Gr. Besar</th><th>Gr. B2</th><th>Satuan</th><th>Keterangan</th>
  </tr></thead>`;
  const tbody = document.createElement('tbody');

  KATEGORI.forEach((kat, rowIndex) => {
    const tr = document.createElement('tr');
    const item = state.hari[dayKey].items[kat.key];

    const tdKat = document.createElement('td');
    tdKat.textContent = kat.label;
    tr.appendChild(tdKat);

    const cells = [
      { field: 'bahan', value: item.bahan, placeholder: 'Ayam Fillet' },
      { field: 'hidangan', value: item.hidangan, placeholder: 'Ayam Katsu' },
      { field: 'instruksi', value: item.instruksi, placeholder: 'cara olah...', type: 'textarea', extraClass: 'cell-instruksi' },
      { field: 'gramasiBalita', value: item.gramasi.balita, placeholder: '35', extraClass: 'cell-narrow' },
      { field: 'gramasiKecil', value: item.gramasi.kecil, placeholder: '45', extraClass: 'cell-narrow' },
      { field: 'gramasiBesar', value: item.gramasi.besar, placeholder: '65', extraClass: 'cell-narrow' },
      { field: 'gramasiB2', value: item.gramasi.b2, placeholder: '80', extraClass: 'cell-narrow' },
      { field: 'satuan', value: item.satuan, placeholder: 'GRAM', extraClass: 'cell-narrow' },
      { field: 'keterangan', value: item.keterangan, placeholder: 'opsional' },
    ];
    cells.forEach(c => {
      const td = document.createElement('td');
      td.appendChild(makeCellInput({ dayKey, katKey: kat.key, rowIndex, dayIndex, ...c }));
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  scroller.appendChild(table);
  container.appendChild(scroller);

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
 * Satu handler paste, dua mode otomatis:
 * - 2 kolom  -> mode "SIKLUS MENU": Bahan+Hidangan, bisa menyebar lintas hari (10 kolom = 5 hari x 2).
 * - >=4 kolom -> mode "STANDART_M1/M2": kolom B:K (Bahan, Hidangan, Instruksi, [Bahan detail-diabaikan],
 *   Gramasi Balita/Kecil/Besar/B2, Satuan, Keterangan) dari 5 baris utama satu hari (skip baris bumbu).
 *   Mode ini hanya mengisi hari tempat kamu klik pertama kali (tidak menyebar ke hari lain).
 */
function handlePaste(e) {
  const target = e.target;
  if (!(target.matches('input[type="text"]') || target.tagName === 'TEXTAREA') || target.dataset.dayIndex === undefined) return;

  const text = (e.clipboardData || window.clipboardData).getData('text');
  if (!text || !/\t|\n/.test(text)) return;

  const rows = text.replace(/\r/g, '').split('\n')
    .filter((row, idx, arr) => !(idx === arr.length - 1 && row === ''));
  const firstRowCols = rows[0].split('\t');

  e.preventDefault();

  const startDay = parseInt(target.dataset.dayIndex, 10);
  const startRow = parseInt(target.dataset.rowIndex, 10);

  if (firstRowCols.length >= 4) {
    pasteRichDay(rows, startDay, startRow);
  } else {
    pasteWeekSimple(rows, startDay, startRow, target.dataset.field === 'bahan' ? 0 : 1);
  }

  saveState();
  showToast('Menu berhasil ditempel.');
}

function applyField(dayIdx, rIdx, field, rawVal) {
  if (rIdx >= KATEGORI.length || dayIdx >= HARI.length) return;
  const katKey = KATEGORI[rIdx].key;
  const dayKey = HARI[dayIdx].key;
  const val = (rawVal || '').trim();
  setItemField(dayKey, katKey, field, val);
  const inputEl = document.querySelector(
    `[data-day-index="${dayIdx}"][data-row-index="${rIdx}"][data-field="${field}"]`
  );
  if (inputEl) inputEl.value = val;
}

function pasteWeekSimple(rows, startDay, startRow, startFieldCol) {
  const startAbsCol = startDay * 2 + startFieldCol;
  rows.forEach((rowStr, i) => {
    const rIdx = startRow + i;
    if (rIdx >= KATEGORI.length) return;
    const cols = rowStr.split('\t');
    cols.forEach((val, j) => {
      const absCol = startAbsCol + j;
      const dayIdx = Math.floor(absCol / 2);
      const field = absCol % 2 === 0 ? 'bahan' : 'hidangan';
      applyField(dayIdx, rIdx, field, val);
    });
  });
}

const RICH_FIELD_ORDER = ['bahan', 'hidangan', 'instruksi', null, 'gramasiBalita', 'gramasiKecil', 'gramasiBesar', 'gramasiB2', 'satuan', 'keterangan'];

function pasteRichDay(rows, dayIdx, startRow) {
  rows.forEach((rowStr, i) => {
    const rIdx = startRow + i;
    if (rIdx >= KATEGORI.length) return;
    const cols = rowStr.split('\t');
    cols.forEach((val, j) => {
      const field = RICH_FIELD_ORDER[j];
      if (!field) return;
      applyField(dayIdx, rIdx, field, val);
    });
  });
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
      rows.push({
        no: no++,
        hidangan: hidangan || '-',
        bahan: bahan || '-',
        instruksi: item.instruksi || '',
        gramasi: { ...item.gramasi },
        satuan: item.satuan || '',
        keterangan: item.keterangan || '',
      });
    }
  });
  if (FORM_META[formKey].includeTambahan) {
    (dayState.tambahan || '').split('\n').map(s => s.trim()).filter(Boolean).forEach(line => {
      rows.push({
        no: no++,
        hidangan: '-',
        bahan: line,
        instruksi: '',
        gramasi: { balita: '', kecil: '', besar: '', b2: '' },
        satuan: '',
        keterangan: '',
      });
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
  return lines.length + 2;
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
    const cl = c.toLowerCase();
    if (i === 0) col.width = 6;
    else if (cl.includes('hidangan')) col.width = 22;
    else if (cl.includes('bahan')) col.width = 24;
    else if (cl.includes('instruksi')) col.width = 45;
    else if (cl.includes('keterangan')) col.width = 30;
    else col.width = 13;
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
      styles: { fontSize: 8, cellPadding: 4, valign: 'middle', lineColor: [220, 216, 198], lineWidth: 0.5 },
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
