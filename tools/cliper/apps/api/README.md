# cliper API

## Jalankan

```powershell
node tools/cliper/apps/api/server.js
```

Default port: `8788`  
Ubah port:

```powershell
$env:PORT=3001; node tools/cliper/apps/api/server.js
```

## Endpoint

- `GET /health`
- `POST /uploads`
- `GET /uploads`
- `POST /jobs`
- `GET /jobs/:id`
- `GET /jobs/:id/results`
- `GET /download/:jobId/:fileName?autoDelete=1`
- `POST /cleanup/all`

## Dependency Sistem

- Wajib: `ffmpeg`, `ffprobe`
- Opsional (untuk URL YouTube): `yt-dlp`

## Alur Upload File Lokal

### 1) Upload video

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8788/uploads" `
  -Headers @{ "x-file-name" = "video-asli.mp4"; "Content-Type" = "video/mp4" } `
  -InFile "C:\path\ke\video-asli.mp4"
```

Ambil `upload.id` dari response.

### 2) Buat job split

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8788/jobs" `
  -ContentType "application/json" `
  -Body '{"sourceType":"upload","uploadId":"<ISI_UPLOAD_ID>","partMinutes":5}'
```

### 3) Cek status job

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:8788/jobs/<JOB_ID>"
```

### 4) Lihat daftar hasil

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:8788/jobs/<JOB_ID>/results"
```

### 5) Download salah satu part

```powershell
Invoke-RestMethod -Method Get `
  -Uri "http://localhost:8788/download/<JOB_ID>/part01.mp4" `
  -OutFile ".\part01.mp4"
```

## Alur Sumber YouTube

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8788/jobs" `
  -ContentType "application/json" `
  -Body '{"sourceType":"youtube","sourceUrl":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","partMinutes":5}'
```

Jika `yt-dlp` tidak terpasang, job akan gagal dengan pesan error yang jelas.

## Cleanup Otomatis

- Default: file hasil dihapus otomatis setelah berhasil didownload (`autoDelete=1`).
- File source di `uploads` juga ikut dihapus otomatis ketika semua part output job tersebut sudah
  terhapus/didownload.
- File yang tidak didownload akan dibersihkan otomatis setelah 1 jam.
- Upload source juga dibersihkan otomatis setelah 1 jam (jika tidak sedang diproses).
- Dari UI Cliper: saat user confirm keluar/reload tab, frontend akan memanggil `POST /cleanup/all`
  untuk membersihkan semua file video (`uploads` + `outputs`).

Env opsional:

```powershell
$env:RESULT_TTL_MS=3600000        # default 1 jam
$env:UPLOAD_TTL_MS=3600000        # default 1 jam
$env:CLEANUP_INTERVAL_MS=300000   # default 5 menit
```
