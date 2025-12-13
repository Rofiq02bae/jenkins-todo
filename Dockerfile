# ==========================================================
# STAGE 1: BUILDER STAGE (Menginstal Dependensi & Caching)
# ==========================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Salin package.json dan package-lock.json terlebih dahulu untuk memanfaatkan caching
COPY package*.json ./

# Instal dependensi (Layer ini hanya akan di-rebuild jika file package*.json berubah)
# Pastikan ini dijalankan tanpa masalah
RUN npm install

# Salin kode aplikasi yang tersisa
COPY . .


# ==========================================================
# STAGE 2: PRODUCTION STAGE (Image Akhir yang Ringan)
# ==========================================================
# Image yang lebih kecil dan aman untuk production
FROM node:20-slim

WORKDIR /usr/src/app

# Salin hanya yang diperlukan dari Stage 'builder':
# 1. node_modules
COPY --from=builder /app/node_modules ./node_modules
# 2. Kode aplikasi (index.js, package.json, dsb.)
COPY --from=builder /app/ .

# Port aplikasi Anda
EXPOSE 3000

# Perintah eksekusi utama
CMD ["node", "index.js"]
