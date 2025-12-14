const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const cors = require('cors');
const promClient = require('prom-client'); // Import
const collectDefaultMetrics = promClient.collectDefaultMetrics;

// Inisialisasi pengumpul metrik default
collectDefaultMetrics({ prefix: 'todo_app_' }); // Tambahkan prefix agar mudah diidentifikasi

// --- 1. KONFIGURASI DATABASE ---
const client = new Client({
    user: process.env.POSTGRES_USER || 'user_todo',
    host: process.env.POSTGRES_HOST || 'db', 
    database: process.env.POSTGRES_DB || 'todo_db',
    password: process.env.POSTGRES_PASSWORD || 'supersecretpassword',
    port: 5432,
    
    // PENTING: Untuk memastikan unit test tidak timeout saat DB tidak tersedia
    connectionTimeoutMillis: 2000, 
});

// Buat counter untuk permintaan API
const httpRequestCounter = new promClient.Counter({
    name: 'todo_app_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'statuscode'],
});

// --- 2. FUNGSI INISIALISASI TABEL ---
async function initializeDatabase() {
    // Di lingkungan Jest (CI), jangan coba koneksi DB agar tidak stuck.
    if (process.env.NODE_ENV === 'test') {
        console.log("Lingkungan Test terdeteksi. Melewati koneksi DB.");
        return; 
    }

    try {
        await client.connect();
        console.log("Koneksi Database Berhasil!");

        // Buat tabel jika belum ada
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                is_completed BOOLEAN DEFAULT FALSE
            );
        `;
        await client.query(createTableQuery);
        console.log("Tabel 'tasks' berhasil dibuat atau sudah ada.");
    } catch (err) {
        // Log error di sini (ENOTFOUND saat CI), tetapi server tetap berjalan
        console.error("Gagal membuat tabel:", err.message);
    }
}

// Panggil fungsi inisialisasi saat aplikasi dimulai
initializeDatabase();

// --- 3. SETUP SERVER EXPRESS ---
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); 
app.use(bodyParser.json());

// Middleware untuk menghitung semua permintaan
app.use((req, res, next) => {
    // Tambahkan logika untuk menghitung permintaan sebelum respons dikirim
    res.on('finish', () => {
        httpRequestCounter.inc({
            method: req.method,
            route: req.path,
            statuscode: res.statusCode,
        });
    });
    next();
});
// Melayani file frontend (index.html, script.js, style.css) dari folder 'public'
app.use(express.static('public')); 

// --- 4. ENDPOINT API RESTFUL ---

// Endpoint Health Check: Digunakan oleh Jest untuk memastikan API berjalan
app.get('/health', (req, res) => {
    res.status(200).send("Welcome to Jenkins Todo API (v1.0)");
});

// GET /tasks: Mendapatkan semua tugas
app.get('/tasks', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM tasks ORDER BY id DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Gagal mendapatkan tasks:", err.message);
        // Mengembalikan 500 jika koneksi DB gagal atau query timeout
        res.status(500).send("Koneksi Database Gagal. Cek log.");
    }
});

// POST /tasks: Menambahkan tugas baru
app.post('/tasks', async (req, res) => {
    const { title } = req.body;
    if (!title) {
        return res.status(400).send("Judul tugas diperlukan.");
    }
    try {
        const result = await client.query(
            'INSERT INTO tasks (title) VALUES ($1) RETURNING *', 
            [title]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Gagal menambahkan task:", err.message);
        res.status(500).send("Internal Server Error.");
    }
});

// Inisialisasi pengumpul metrik default
collectDefaultMetrics({ prefix: 'todo_app_' }); // Tambahkan prefix agar mudah diidentifikasi

// Buat counter untuk permintaan API
const httpRequestCounter = new promClient.Counter({
    name: 'todo_app_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'statuscode'],
});


// --- Tambahkan Endpoint Baru untuk Prometheus ---
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
});

// PUT /tasks/:id: Mengubah status tugas
app.put('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { is_completed } = req.body;

    if (typeof is_completed !== 'boolean') {
        return res.status(400).send("Status is_completed harus boolean.");
    }

    try {
        const result = await client.query(
            'UPDATE tasks SET is_completed = $1 WHERE id = $2 RETURNING *',
            [is_completed, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).send("Task tidak ditemukan.");
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error("Gagal mengupdate task:", err.message);
        res.status(500).send("Internal Server Error.");
    }
});

// DELETE /tasks/:id: Menghapus tugas
app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await client.query('DELETE FROM tasks WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).send("Task tidak ditemukan.");
        }
        res.status(204).send(); 
    } catch (err) {
        console.error("Gagal menghapus task:", err.message);
        res.status(500).send("Internal Server Error.");
    }
});


// --- 5. SERVER LISTENING ---
const server = app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});

// Export server untuk pengujian (Jest)
module.exports = server;
