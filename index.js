const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi koneksi Database dari environment variables (disediakan oleh docker-compose)
const pool = new Pool({
  user: process.env.DB_USER || 'user_todo',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'todo_db',
  password: process.env.DB_PASSWORD || 'supersecretpassword',
  port: 5432,
});

// Fungsi untuk membuat tabel (dijalankan saat start)
async function createTable() {
    try {
        const client = await pool.connect();
        const query = `
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                is_completed BOOLEAN DEFAULT FALSE
            );
        `;
        await client.query(query);
        client.release();
        console.log("Tabel 'tasks' berhasil dibuat atau sudah ada.");
    } catch (err) {
        console.error("Gagal membuat tabel:", err.message);
    }
}

// Endpoint Kesehatan/Koneksi
app.get('/', (req, res) => {
    res.status(200).send({ message: "To-Do API berjalan!", environment: process.env.NODE_ENV || 'development' });
});

// Endpoint untuk mendapatkan semua tasks
app.get('/tasks', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM tasks ORDER BY id');
        client.release();
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Gagal mendapatkan tasks:", err.message);
        res.status(500).send("Koneksi Database Gagal. Cek log.");
    }
});

// --- Fungsi untuk Testing (Simulasi Logika Bisnis) ---
// Fungsi ini akan di-export agar bisa diuji oleh Jest
function calculateSum(a, b) {
    return a + b;
}
// --- Akhir Fungsi Testing ---

createTable().then(() => {
    app.listen(PORT, () => {
        console.log(`Server berjalan di http://localhost:${PORT}`);
    });
});

module.exports = { app, calculateSum }; // Export untuk pengujian
