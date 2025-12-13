const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const cors = require('cors'); // Tambahkan jika Anda menguji dari host lain/port lain

// ... kode konfigurasi database ...

const app = express();

// --- PENTING: TAMBAHKAN MIDDLEWARE UNTUK SERVE FILE STATIS ---
app.use(express.static('public')); 
// Sekarang, ketika browser mengakses /, ia akan otomatis memuat public/index.html
// ---------------------------------------------------------------------

app.use(cors()); // Middleware CORS
app.use(bodyParser.json());

// ... (sisa kode setup API Anda) ...
