-- ============================================================
-- BAM (Baitul Amal Madani) — Database Schema + Seed Data
-- Run: psql bam_db < db/init.sql
-- ============================================================

-- ── TABLES ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaign (
  id                   INT PRIMARY KEY DEFAULT 1,
  nama_campaign        TEXT NOT NULL DEFAULT '',
  nama_org             TEXT NOT NULL DEFAULT '',
  deskripsi            TEXT DEFAULT '',
  target               BIGINT DEFAULT 0,
  terkumpul            BIGINT DEFAULT 0,
  tgl_mulai            DATE,
  tgl_selesai          DATE,
  wa_number            VARCHAR(25) DEFAULT '',
  status               VARCHAR(20) DEFAULT 'active',
  hero_image_url       TEXT DEFAULT '',
  quran_tersalurkan    INT DEFAULT 0,
  provinsi_terjangkau  INT DEFAULT 0,
  presets              JSONB DEFAULT '[]'::JSONB,
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donors (
  id          VARCHAR(50) PRIMARY KEY,
  nama        TEXT NOT NULL,
  email       TEXT,
  phone       VARCHAR(50),
  kota        TEXT,
  provinsi    TEXT,
  jumlah      BIGINT NOT NULL,
  tanggal     TIMESTAMPTZ,
  doa         TEXT,
  kategori    VARCHAR(20),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS updates (
  id            VARCHAR(50) PRIMARY KEY,
  tanggal       DATE NOT NULL,
  judul         TEXT NOT NULL,
  deskripsi     TEXT,
  thumbnail_url TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faqs (
  id           VARCHAR(50) PRIMARY KEY,
  pertanyaan   TEXT NOT NULL,
  jawaban      TEXT NOT NULL,
  order_index  INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── SEED DATA ────────────────────────────────────────────────

-- Campaign (single row)
INSERT INTO campaign (
  id, nama_campaign, nama_org, deskripsi,
  target, terkumpul, tgl_mulai, tgl_selesai,
  wa_number, status, hero_image_url,
  quran_tersalurkan, provinsi_terjangkau, presets
) VALUES (
  1,
  'Infaq Quran untuk Pesantren & Masjid',
  'Baitul Amal Madani',
  'Program Infaq Quran merupakan ikhtiar Baitul Amal Madani dalam menyebarkan kalam Allah ke seluruh penjuru negeri. Kami hadir untuk memastikan setiap pesantren, masjid, dan musholla memiliki Al-Quran yang cukup dan layak.',
  135000000,
  115902784,
  '2026-02-01',
  '2026-03-27',
  '6282129334399',
  'active',
  'https://picsum.photos/seed/qurandonation99/860/460',
  1240,
  12,
  '[{"amount":25000,"label":"Infaq ¼ Al-Quran"},{"amount":50000,"label":"Infaq ½ Al-Quran"},{"amount":100000,"label":"Infaq 1 Al-Quran"},{"amount":250000,"label":"Infaq 3 Al-Quran"}]'::JSONB
) ON CONFLICT (id) DO NOTHING;

-- Donors (15 seed records)
INSERT INTO donors (id, nama, email, phone, kota, provinsi, jumlah, tanggal, doa, kategori, created_at) VALUES
('d_001', 'Ahmad Fauzi', 'ahmad@email.com', '081234567890', 'Bandung', 'Jawa Barat', 100000, '2026-03-09T10:02:00Z', 'Semoga berkah dan bermanfaat', 'Loyal', '2026-03-09T10:02:00Z'),
('d_002', 'Siti Rahayu', 'siti@email.com', '082345678901', 'Jakarta', 'DKI Jakarta', 250000, '2026-03-08T14:30:00Z', 'Aamiin ya Rabb', 'Loyal', '2026-03-08T14:30:00Z'),
('d_003', 'Budi Santoso', NULL, '083456789012', 'Surabaya', 'Jawa Timur', 50000, '2026-03-08T09:15:00Z', NULL, 'Baru', '2026-03-08T09:15:00Z'),
('d_004', 'Dewi Kusuma', 'dewi@email.com', NULL, 'Yogyakarta', 'DI Yogyakarta', 500000, '2026-03-07T16:45:00Z', 'Semoga Allah membalas kebaikan', 'Loyal', '2026-03-07T16:45:00Z'),
('d_005', 'Hendra Wijaya', NULL, '085678901234', 'Medan', 'Sumatera Utara', 1000000, '2026-03-07T11:20:00Z', 'Lillahi taala', 'VIP', '2026-03-07T11:20:00Z'),
('d_006', 'Nurul Hidayah', 'nurul@email.com', '086789012345', 'Makassar', 'Sulawesi Selatan', 25000, '2026-03-06T13:00:00Z', NULL, 'Baru', '2026-03-06T13:00:00Z'),
('d_007', 'Rizky Pratama', NULL, '087890123456', 'Semarang', 'Jawa Tengah', 150000, '2026-03-06T08:30:00Z', 'Semoga menjadi amal jariyah', 'Loyal', '2026-03-06T08:30:00Z'),
('d_008', 'Anonim', NULL, NULL, NULL, NULL, 75000, '2026-03-05T20:10:00Z', 'Ikhlas karena Allah', 'Baru', '2026-03-05T20:10:00Z'),
('d_009', 'Maya Sari', 'maya@email.com', '089012345678', 'Palembang', 'Sumatera Selatan', 200000, '2026-03-05T15:45:00Z', NULL, 'Loyal', '2026-03-05T15:45:00Z'),
('d_010', 'Fajar Nugroho', NULL, '081123456789', 'Bogor', 'Jawa Barat', 100000, '2026-03-04T12:00:00Z', 'Semoga bermanfaat', 'Loyal', '2026-03-04T12:00:00Z'),
('d_011', 'Lina Marlina', 'lina@email.com', '082234567890', 'Cirebon', 'Jawa Barat', 300000, '2026-03-04T09:30:00Z', NULL, 'Loyal', '2026-03-04T09:30:00Z'),
('d_012', 'Dodi Firmansyah', NULL, '083345678901', 'Pekanbaru', 'Riau', 500000, '2026-03-03T17:15:00Z', 'Semoga Allah merahmati', 'Loyal', '2026-03-03T17:15:00Z'),
('d_013', 'Rina Wati', 'rina@email.com', NULL, 'Denpasar', 'Bali', 750000, '2026-03-03T14:00:00Z', 'Aamiin', 'VIP', '2026-03-03T14:00:00Z'),
('d_014', 'Agus Setiawan', NULL, '085456789012', 'Banjarmasin', 'Kalimantan Selatan', 25000, '2026-03-02T10:45:00Z', NULL, 'Baru', '2026-03-02T10:45:00Z'),
('d_015', 'Yuni Astuti', 'yuni@email.com', '086567890123', 'Malang', 'Jawa Timur', 100000, '2026-03-01T08:00:00Z', 'Barakallah', 'Loyal', '2026-03-01T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Updates (3 seed records)
INSERT INTO updates (id, tanggal, judul, deskripsi, thumbnail_url, created_at) VALUES
('u_001', '2026-03-05', 'Distribusi 50 Quran ke Pesantren Al-Hikmah', 'Alhamdulillah, 50 Al-Quran telah diserahkan kepada santri Pesantren Al-Hikmah Bandung. Semoga bermanfaat.', 'https://picsum.photos/seed/upd1/144/144', '2026-03-05T10:00:00Z'),
('u_002', '2026-02-28', 'Pelatihan Guru Mengaji Angkatan ke-8', 'Sebanyak 25 guru mengaji mengikuti pelatihan metode tahsin terbaru bersama ustadz hafizh nasional.', 'https://picsum.photos/seed/upd2/144/144', '2026-02-28T10:00:00Z'),
('u_003', '2026-02-15', 'Penyerahan Beasiswa kepada 20 Santri', '20 santri berprestasi mendapatkan beasiswa pendidikan selama 1 tahun penuh dari program Infaq Quran.', 'https://picsum.photos/seed/upd3/144/144', '2026-02-15T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- FAQs (5 seed records)
INSERT INTO faqs (id, pertanyaan, jawaban, order_index, created_at) VALUES
('f_001', 'Bagaimana cara berdonasi?', 'Pilih nominal infaq yang Anda inginkan, lalu klik tombol "Donasi Sekarang". Anda akan diarahkan ke WhatsApp kami untuk konfirmasi dan petunjuk transfer.', 0, '2026-01-01T00:00:00Z'),
('f_002', 'Bisakah atas nama orang lain?', 'Tentu! Anda bisa berdonasi atas nama orang lain, misalnya sebagai hadiah atau sedekah untuk orang yang telah tiada. Cantumkan nama yang bersangkutan saat konfirmasi via WhatsApp.', 1, '2026-01-01T00:00:00Z'),
('f_003', 'Bagaimana laporan penggunaan dana?', 'Kami mengirimkan laporan rutin via WhatsApp kepada seluruh donatur, meliputi foto distribusi, jumlah Quran tersalurkan, dan dokumentasi kegiatan secara transparan.', 2, '2026-01-01T00:00:00Z'),
('f_004', 'Berapa minimal donasi?', 'Tidak ada minimal donasi. Namun kami menyediakan paket mulai dari Rp 25.000 (setara ¼ Al-Quran) hingga Rp 250.000 (3 Al-Quran) untuk memudahkan pilihan Anda.', 3, '2026-01-01T00:00:00Z'),
('f_005', 'Apakah donasi saya aman?', 'Kami adalah yayasan terdaftar resmi. Setiap donasi tercatat dan dilaporkan secara transparan. Anda akan menerima konfirmasi penerimaan donasi via WhatsApp.', 4, '2026-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
