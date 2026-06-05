const API_URL = 'https://dummyjson.com/products';

// DOM Elements
const productForm = document.getElementById('product-form');
const productIdInput = document.getElementById('product-id');
const productTitleInput = document.getElementById('product-title');
const productPriceInput = document.getElementById('product-price');
const formTitle = document.getElementById('form-title');
const btnSubmit = document.getElementById('btn-submit');
const btnCancel = document.getElementById('btn-cancel');
const productList = document.getElementById('product-list');
const loadingEl = document.getElementById('loading');
const errorBox = document.getElementById('error-message');
const successBox = document.getElementById('success-message');

// State Aplikasi (menyimpan data sementara di memori)
let productsState = [];
let isEditMode = false;

// Initialize App
document.addEventListener('DOMContentLoaded', fetchProducts);
productForm.addEventListener('submit', handleFormSubmit);
btnCancel.addEventListener('click', resetForm);

/**
 * Tampilkan Pesan Error Berdasarkan Ketentuan Soal
 */
function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
    setTimeout(() => errorBox.classList.add('hidden'), 5000);
}

/**
 * Tampilkan Pesan Sukses
 */
function showSuccess(message) {
    successBox.textContent = message;
    successBox.classList.remove('hidden');
    setTimeout(() => successBox.classList.add('hidden'), 3000);
}

/**
 * 1. GET DATA - Memuat Data Awal dari API
 */
async function fetchProducts() {
    try {
        // Simulasi Error Handling jika URL salah (Aktifkan baris di bawah untuk uji coba)
        // const response = await fetch('https://dummyjson.com/salah-url');
        
        const response = await fetch(`${API_URL}?limit=6`);
        
        if (!response.ok) throw new Error('Gagal mengambil data dari server!');
        
        const data = await response.json();
        productsState = data.products;
        renderProducts();
    } catch (error) {
        showError(`[Error Fetch]: ${error.message}`);
    } finally {
        loadingEl.classList.add('hidden');
    }
}

/**
 * Render Data State ke dalam DOM
 */
function renderProducts() {
    productList.innerHTML = '';
    
    if (productsState.length === 0) {
        productList.innerHTML = '<p class="loading">Tidak ada produk tersedia.</p>';
        return;
    }

    productsState.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-item';
        productCard.setAttribute('data-id', product.id);
        
        productCard.innerHTML = `
            <div>
                <h3>${product.title}</h3>
                <p class="product-price">$${product.price}</p>
            </div>
            <div class="product-actions">
                <button class="btn btn-edit" onclick="setupEditMode(${product.id})">Edit</button>
                <button class="btn btn-delete" onclick="deleteProduct(${product.id})">Hapus</button>
            </div>
        `;
        productList.appendChild(productCard);
    });
}

/**
 * Handler Submit Form (Menangani Create atau Update)
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const title = productTitleInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    
    if (isEditMode) {
        const id = productIdInput.value;
        await updateProduct(id, title, price);
    } else {
        await createProduct(title, price);
    }
}

/**
 * 2. TAMBAH DATA (POST)
 */
async function createProduct(title, price) {
    try {
        const response = await fetch(`${API_URL}/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, price })
        });

        if (!response.ok) throw new Error('Gagal menambahkan produk baru.');

        const newProduct = await response.json();
        
        // Manipulasi DOM secara dinamis: masukkan ke baris paling depan state
        productsState.unshift(newProduct);
        renderProducts();
        
        showSuccess(`Produk "${newProduct.title}" berhasil ditambahkan!`);
        resetForm();
    } catch (error) {
        showError(`[Error POST]: ${error.message}`);
    }
}

/**
 * Setup data dari UI masuk kembali ke form saat tombol Edit ditekan
 */
function setupEditMode(id) {
    const product = productsState.find(p => p.id === id);
    if (!product) return;

    isEditMode = true;
    formTitle.textContent = 'Edit Produk';
    btnSubmit.textContent = 'Perbarui Data';
    btnCancel.classList.remove('hidden');

    productIdInput.value = product.id;
    productTitleInput.value = product.title;
    productPriceInput.value = product.price;

    // Scroll otomatis ke area form agar UX lebih baik
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

/**
 * 3. EDIT DATA (PUT/PATCH)
 */
async function updateProduct(id, title, price) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT', // Atau 'PATCH'
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, price })
        });

        if (!response.ok) throw new Error('Gagal memperbarui data produk.');

        const updatedData = await response.json();

        // Manipulasi DOM secara dinamis: perbarui item di dalam array state
        productsState = productsState.map(product => 
            product.id == id ? { ...product, title: updatedData.title, price: updatedData.price } : product
        );
        renderProducts();

        showSuccess(`Produk ID #${id} berhasil diperbarui!`);
        resetForm();
    } catch (error) {
        showError(`[Error PUT]: ${error.message}`);
    }
}

/**
 * 4. HAPUS DATA (DELETE)
 */
async function deleteProduct(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Gagal menghapus produk dari server.');

        const resData = await response.json();

        // Sesuai dokumentasi & soal wajib cek flag isDeleted
        if (resData.isDeleted) {
            // Manipulasi DOM dinamis: hapus elemen dari state & render ulang tanpa reload halaman
            productsState = productsState.filter(product => product.id !== id);
            renderProducts();
            
            showSuccess(`Produk dengan ID #${id} berhasil dihapus dari UI.`);
        } else {
            throw new Error('Server mengembalikan status sukses tapi status isDeleted bernilai false.');
        }
    } catch (error) {
        showError(`[Error DELETE]: ${error.message}`);
    }
}

/**
 * Reset status Form kembali ke awal
 */
function resetForm() {
    isEditMode = false;
    formTitle.textContent = 'Tambah Produk Baru';
    btnSubmit.textContent = 'Simpan Produk';
    btnCancel.classList.add('hidden');
    
    productForm.reset();
    productIdInput.value = '';
}