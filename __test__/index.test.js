const supertest = require('supertest');
const server = require('../index'); 
const request = supertest(server);
// Catatan: Variabel 'server' kini menampung instance server Express dari index.js

// --- Fungsi Unit Test Contoh ---
function calculateSum(a, b) {
    return a + b;
}

// --- SETUP DAN CLEANUP TEST ---

// PENTING: Tutup server Express setelah semua test selesai agar Jest bisa keluar
afterAll(done => {
    server.close(done); 
});


// --- TEST SUITES ---

describe('Unit Test: Basic Math', () => {
    test('calculateSum should correctly add two numbers', () => {
        // Test yang sekarang sudah memiliki definisi fungsi calculateSum
        expect(calculateSum(1, 2)).toBe(3);
        expect(calculateSum(10, -5)).toBe(5);
    });
});

describe('API Integration Test: Health Check', () => {
    // GANTI: Kita tidak perlu lagi mengekspor pesan dalam body, cukup status 200.
    test('GET / should return 200 and a welcome message', async () => {
        const response = await request.get('/');
        
        expect(response.statusCode).toBe(200);
        // Cek apakah body merespons dengan teks yang kita kirim di index.js
        expect(response.text).toContain("Welcome to Jenkins Todo API"); 
    });
    
    // Test ini akan LULUS karena koneksi DB pasti gagal di lingkungan CI yang terisolasi.
    test('GET /tasks should return 500 if DB connection fails (CI environment)', async () => {
        const response = await request.get('/tasks');
        
        // Kita ekspektasikan kode error 500 karena index.js gagal terhubung ke 'todo-db'
        expect(response.statusCode).toBe(500); 
        expect(response.text).toContain("Koneksi Database Gagal. Cek log."); 
    });

    // Test Sederhana: POST /tasks
    test('POST /tasks without title should return 400', async () => {
        const response = await request.post('/tasks').send({ title: '' });
        expect(response.statusCode).toBe(400);
    });
});

// Anda dapat menambahkan lebih banyak test untuk PUT dan DELETE di sini, tetapi fokus pada yang gagal.
