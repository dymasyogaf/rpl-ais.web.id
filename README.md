# RPL Website

Website profil Jurusan Rekayasa Perangkat Lunak SMK IT Alhidayah.

## Struktur

```text
rpl-website/
|-- index.html
|-- assets/
|   |-- css/
|   |   |-- main.css
|   |   `-- components.css
|   `-- js/
|       |-- tailwind-config.js
|       |-- component-loader.js
|       `-- main.js
|-- components/
|   `-- sections/
|       |-- navbar.html
|       |-- hero.html
|       |-- about.html
|       |-- siswa.html
|       |-- guru.html
|       |-- prospek.html
|       |-- footer.html
|       `-- chat.html
`-- backup/
    `-- index copy.html
```

## Menjalankan

```bash
python -m http.server 8000
```

Buka `http://localhost:8000`.

## Catatan

- `index.html` adalah shell utama.
- Konten halaman dipecah per section pada `components/sections/`.
- Semua section dimuat lewat `assets/js/component-loader.js`.
- Interaksi UI (navbar, carousel, chat, spotlight, skills globe) diatur oleh `assets/js/main.js`.
