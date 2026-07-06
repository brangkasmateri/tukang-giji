# Alur Dokumentasi Dapur SPPG — Menu ke Form Kerja

Web sederhana (HTML/CSS/JS murni, tanpa backend/database) untuk membantu ahli gizi SPPG mengubah **satu menu mingguan** menjadi **4 dokumen kerja siap cetak**:

1. Form Permintaan Belanja
2. Form Persiapan
3. Form Pengolahan (SOP Masak)
4. Form Pemorsian

Semua data diproses langsung di browser pengguna (client-side) — tidak ada data yang dikirim ke server manapun. Draf isian disimpan otomatis di `localStorage` browser masing-masing perangkat.

## Cara pakai (lokal)

Cukup buka `index.html` langsung di browser, atau jalankan server statis sederhana:

```bash
python3 -m http.server 8000
# lalu buka http://localhost:8000
```

## Deploy ke GitHub Pages

1. Buat repository baru di GitHub (atau pakai yang sudah ada), lalu push seluruh isi folder ini (`index.html`, `style.css`, `app.js`) ke branch `main`.
   ```bash
   git init
   git add .
   git commit -m "Initial commit: alur dokumentasi SPPG"
   git branch -M main
   git remote add origin https://github.com/<username>/<nama-repo>.git
   git push -u origin main
   ```
2. Di GitHub, buka repo → **Settings** → **Pages**.
3. Pada **Source**, pilih branch `main` dan folder `/ (root)`, lalu **Save**.
4. Tunggu 1–2 menit, situs akan aktif di `https://<username>.github.io/<nama-repo>/`.

## Struktur project

```
index.html   → tampilan & struktur form input
style.css    → gaya visual
app.js       → logika input, state, dan generator PDF/Excel
```

## Catatan pengembangan lanjutan

Versi ini masih pakai **input manual** (belum otomatis dari database resep). Beberapa arah lanjutan yang bisa ditambahkan nanti:

- Dropdown pilihan menu dari siklus menu baku (data resep per hidangan disimpan sebagai JSON di dalam project), sehingga bahan & gramasi terisi otomatis.
- Perhitungan otomatis kebutuhan bahan (KG) dari jumlah porsi per kategori (Balita/Kecil/Besar/B2).
- Riwayat/arsip menu mingguan yang tersimpan (butuh backend/database ringan seperti Supabase atau Google Sheets API bila data perlu diakses lintas perangkat).

## Ketergantungan (via CDN)

- [ExcelJS](https://github.com/exceljs/exceljs) — generate file `.xlsx`
- [jsPDF](https://github.com/parallax/jsPDF) + [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) — generate file `.pdf`

Tidak perlu instalasi apapun karena dimuat langsung dari CDN (cdnjs.cloudflare.com).
