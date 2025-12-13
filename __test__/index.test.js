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
    // Kita biarkan timeout yang besar sebagai jaring pengaman terakhir.
    server.close(done); 
}, 25000); // Biarkan 25 detik sebagai penutup

// --- TEST SUITES ---

describe('Unit Test: Basic Math', () => {
    test('calculateSum should correctly add two numbers', () => {
        expect(calculateSum(1, 2)).toBe(3);
        expect(calculateSum(10, -5)).toBe(5);
    });
});

describe('API Integration Test: Health Check', () => {
    
    test('GET /health should return 200 and a welcome message', async () => { 
        const response = await request.get('/health');
        
        expect(response.statusCode).toBe(200);
        expect(response.text).toContain("Welcome to Jenkins Todo API"); 
    });
    
    // Test GET /tasks yang gagal karena DB dependency telah dihapus.

    // Test Sederhana: POST /tasks
    test('POST /tasks without title should return 400', async () => {
        const response = await request.post('/tasks').send({ title: '' });
        expect(response.statusCode).toBe(400);
    });
});
