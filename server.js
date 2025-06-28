const express = require('express');
const multer = require('multer');
const path = require('path'); // Pastikan 'path' sudah di-import
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// --- PERUBAHAN PENTING DI SINI ---
// Gunakan direktori /tmp yang disediakan oleh Vercel
const UPLOAD_DIR = path.join('/tmp', 'uploads'); 

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Buat folder uploads di dalam /tmp jika belum ada
// Kode ini tetap penting
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());

// Sajikan file dari direktori upload sementara kita
app.use('/uploads', express.static(UPLOAD_DIR)); 

// (Tidak perlu lagi menyajikan 'public' dari sini karena sudah diatur oleh vercel.json)
// app.use(express.static(path.join(__dirname, 'public')));


// Konfigurasi Multer untuk penyimpanan file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter file untuk validasi tipe
const fileFilter = (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format file tidak diizinkan! Hanya JPG, PNG, GIF.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: MAX_SIZE },
    fileFilter: fileFilter
}).single('photo');

// --- API Endpoints ---

// Endpoint untuk upload foto
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            // Menangani semua jenis error dari multer atau fileFilter
            return res.status(400).json({ success: false, message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Tidak ada file yang diupload!' });
        }
        res.json({ success: true, message: `Foto berhasil diupload: ${req.file.originalname}` });
    });
});

// Endpoint untuk mendapatkan daftar foto
app.get('/photos', (req, res) => {
    fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err) {
            // Jika direktori /tmp/uploads belum ada atau tidak bisa dibaca, kirim pesan error
            console.error("Gagal membaca direktori:", err);
            return res.status(500).json({ success: false, message: 'Gagal membaca direktori foto di server.' });
        }
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
        });
        res.json({ success: true, photos: imageFiles.reverse() });
    });
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
