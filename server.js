const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Konfigurasi
const UPLOAD_DIR = 'uploads/';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Buat folder uploads jika belum ada
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Middleware
app.use(cors()); // Mengizinkan request dari domain lain (frontend)
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, UPLOAD_DIR))); // Menyajikan file di folder uploads
app.use(express.static(path.join(__dirname, 'public'))); // Menyajikan file frontend (HTML, CSS, JS)

// Konfigurasi Multer untuk penyimpanan file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Generate nama file unik
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
}).single('photo'); // 'photo' adalah nama dari field input di form

// --- API Endpoints ---

// Endpoint untuk upload foto
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Error dari Multer (misal: ukuran file terlalu besar)
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, message: 'Ukuran file terlalu besar! Maksimal 5MB' });
            }
            return res.status(400).json({ success: false, message: err.message });
        } else if (err) {
            // Error lain (misal: tipe file tidak valid)
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
            return res.status(500).json({ success: false, message: 'Gagal membaca direktori foto.' });
        }
        // Filter untuk memastikan hanya file gambar yang dikirim
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
        });
        res.json({ success: true, photos: imageFiles.reverse() }); // Dibalik agar yang terbaru di atas
    });
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});