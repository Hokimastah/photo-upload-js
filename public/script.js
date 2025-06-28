document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const photoInput = document.getElementById('photoInput');
    const filePreview = document.getElementById('filePreview');
    const uploadBtn = document.getElementById('uploadBtn');
    const messageContainer = document.getElementById('messageContainer');
    const galleryGrid = document.getElementById('galleryGrid');
    const photoCount = document.getElementById('photoCount');
    
 const API_URL = 'https://photo-upload-4lgtu1t8j-satrios-projects-a6b62f38.vercel.app';

    // Fungsi untuk menampilkan pesan
    const showMessage = (message, type = 'error') => {
        messageContainer.innerHTML = `<div class="alert ${type}">${message}</div>`;
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 5000); // Pesan hilang setelah 5 detik
    };

    // Fungsi untuk memuat foto ke galeri
    const loadPhotos = async () => {
        try {
            const response = await fetch(`${API_URL}/photos`);
            const data = await response.json();

            if (data.success) {
                galleryGrid.innerHTML = ''; // Kosongkan galeri
                photoCount.textContent = data.photos.length;
                data.photos.forEach(photo => {
                    const photoItem = `
                        <div class="photo-item">
                            <img src="${API_URL}/uploads/${photo}" alt="${photo}">
                            <div class="photo-info">
                                <div class="photo-name">${photo}</div>
                            </div>
                        </div>
                    `;
                    galleryGrid.insertAdjacentHTML('beforeend', photoItem);
                });
            } else {
                showMessage('Gagal memuat galeri foto.');
            }
        } catch (error) {
            console.error('Error fetching photos:', error);
            showMessage('Terjadi kesalahan saat menghubungi server.');
        }
    };

    // Event listener untuk input file
    photoInput.addEventListener('change', function() {
        const file = this.files[0];
        
        if (file) {
            // Tampilkan preview file
            filePreview.innerHTML = `
                <strong>File terpilih:</strong> ${file.name}<br>
                <strong>Ukuran:</strong> ${(file.size / 1024 / 1024).toFixed(2)} MB<br>
                <strong>Tipe:</strong> ${file.type}
            `;
            filePreview.style.display = 'block';
            uploadBtn.disabled = false;
            
            // Validasi ukuran file (client-side)
            if (file.size > 5 * 1024 * 1024) {
                filePreview.innerHTML += '<br><span style="color: red;">⚠️ File terlalu besar! Maksimal 5MB</span>';
                uploadBtn.disabled = true;
            }
            
            // Validasi tipe file (client-side)
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                filePreview.innerHTML += '<br><span style="color: red;">⚠️ Tipe file tidak diizinkan!</span>';
                uploadBtn.disabled = true;
            }
            
        } else {
            filePreview.style.display = 'none';
            uploadBtn.disabled = true;
        }
    });
    
    // Event listener untuk form submit
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // Mencegah form submit default
        
        const file = photoInput.files[0];
        if (!file || uploadBtn.disabled) {
            return;
        }
        
        const formData = new FormData();
        formData.append('photo', file);
        
        // Ubah tampilan tombol
        uploadBtn.innerHTML = 'Mengupload...';
        uploadBtn.disabled = true;
        
        try {
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showMessage(result.message, 'success');
                uploadForm.reset(); // Reset form
                filePreview.style.display = 'none';
                await loadPhotos(); // Muat ulang galeri
            } else {
                showMessage(result.message || 'Gagal mengupload file.', 'error');
            }
            
        } catch (error) {
            console.error('Upload error:', error);
            showMessage('Terjadi kesalahan koneksi saat mengupload.', 'error');
        } finally {
            // Kembalikan tampilan tombol
            uploadBtn.innerHTML = 'Upload Foto';
            // Tombol tetap disabled sampai file baru dipilih
        }
    });

    // Muat foto saat halaman pertama kali dibuka
    loadPhotos();
});
