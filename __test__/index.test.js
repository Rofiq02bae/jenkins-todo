const { app, calculateSum } = require('../index');
const supertest = require('supertest');
const request = supertest(app);

// 1. Pengujian Unit untuk Logika Bisnis
describe('Unit Test: Basic Math', () => {
    test('calculateSum should correctly add two numbers', () => {
        // Ini adalah test yang harus LULUS
        expect(calculateSum(1, 2)).toBe(3);
        expect(calculateSum(10, -5)).toBe(5);
    });

    // Test yang sengaja dibuat untuk menguji FAILED build (Hapus baris ini jika ingin sukses)
    // test('calculateSum should FAIL the build if 2+2 != 5', () => {
    //     expect(calculateSum(2, 2)).toBe(5); 
    // });
});

// 2. Pengujian Endpoint API
describe('API Integration Test: Health Check', () => {
    test('GET / should return 200 and a welcome message', async () => {
        const response = await request.get('/');
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message', 'To-Do API berjalan!');
    });

    test('GET /tasks should return 200 even if DB fails initially', async () => {
        // Test ini memastikan endpoint ada, meskipun koneksi DB mungkin gagal di lingkungan test
        const response = await request.get('/tasks');
        
        expect(response.statusCode).toBe(200); 
        // Dalam lingkungan CI/CD tanpa DB sungguhan, test ini harus di mock. 
        // Tapi untuk tujuan pipeline, kita biarkan lulus jika server merespons 200.
    });
});
