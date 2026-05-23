import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config as dotenvConfig } from 'dotenv'

// Load .env relative to this file's directory (works regardless of CWD)
dotenvConfig({ path: join(dirname(fileURLToPath(import.meta.url)), '.env') })

import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { put } from '@vercel/blob'
import { randomUUID } from 'crypto'
import { mkdirSync, existsSync, writeFileSync } from 'fs'
import pool from './db.js'
import { requireApiKey } from './middleware/auth.js'
import campaignRouter from './routes/campaign.js'
import donorsRouter from './routes/donors.js'
import updatesRouter from './routes/updates.js'
import faqsRouter from './routes/faqs.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

// Local fallback uploads dir (for development only — Vercel filesystem is read-only)
const uploadsDir = join(__dirname, 'uploads')
if (!process.env.VERCEL && !existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true })

const app = express()
const PORT = process.env.PORT || 3031
const IS_VERCEL = !!process.env.VERCEL

// ── Multer — memory storage (works for both local and Vercel Blob) ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Hanya file gambar yang diizinkan'))
  },
})

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => cb(null, true), // Allow all origins (Vercel + local)
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key'],
}))
app.use(express.json())

// Serve local uploads only in development (express.static = built-in, no dynamic import needed)
if (!IS_VERCEL) {
  app.use('/uploads', express.static(uploadsDir))
}

// ── Routes ───────────────────────────────────────────────────
app.use('/api/campaign', campaignRouter)
app.use('/api/donors',   donorsRouter)
app.use('/api/updates',  updatesRouter)
app.use('/api/faqs',     faqsRouter)

// POST /api/upload — upload gambar ke Vercel Blob (prod) atau local (dev)
app.post('/api/upload', requireApiKey, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Tidak ada file yang diupload' })
  try {
    let url
    if (IS_VERCEL && process.env.BLOB_READ_WRITE_TOKEN) {
      // Production: upload ke Vercel Blob
      const ext      = req.file.originalname.split('.').pop().toLowerCase()
      const filename = `uploads/${randomUUID()}.${ext}`
      const blob = await put(filename, req.file.buffer, {
        access: 'public',
        contentType: req.file.mimetype,
      })
      url = blob.url
    } else {
      // Development: simpan ke disk lokal
      const ext      = req.file.originalname.split('.').pop().toLowerCase()
      const filename = `${randomUUID()}.${ext}`
      writeFileSync(join(uploadsDir, filename), req.file.buffer)
      url = `http://localhost:${PORT}/uploads/${filename}`
    }
    res.json({ ok: true, url })
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/export — export all data as JSON
app.get('/api/export', requireApiKey, async (req, res) => {
  try {
    const [camp, donors, updates, faqs] = await Promise.all([
      pool.query('SELECT * FROM campaign WHERE id=1'),
      pool.query('SELECT * FROM donors ORDER BY tanggal DESC'),
      pool.query('SELECT * FROM updates ORDER BY tanggal DESC'),
      pool.query('SELECT * FROM faqs ORDER BY order_index ASC'),
    ])
    res.json({
      exportedAt:   new Date().toISOString(),
      version:      '2.0',
      bam_campaign: camp.rows[0] || null,
      bam_donors:   donors.rows,
      bam_updates:  updates.rows,
      bam_faq:      faqs.rows,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/import — import backup JSON
app.post('/api/import', requireApiKey, async (req, res) => {
  const { bam_campaign, bam_donors, bam_updates, bam_faq } = req.body
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (bam_campaign) {
      const c = bam_campaign
      await client.query(`
        INSERT INTO campaign (id,nama_campaign,nama_org,deskripsi,target,terkumpul,tgl_mulai,tgl_selesai,wa_number,status,hero_image_url,quran_tersalurkan,provinsi_terjangkau,presets,updated_at)
        VALUES (1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
        ON CONFLICT (id) DO UPDATE SET
          nama_campaign=$1,nama_org=$2,deskripsi=$3,target=$4,terkumpul=$5,
          tgl_mulai=$6,tgl_selesai=$7,wa_number=$8,status=$9,hero_image_url=$10,
          quran_tersalurkan=$11,provinsi_terjangkau=$12,presets=$13,updated_at=NOW()
      `, [c.nama_campaign||c.namaCampaign,c.nama_org||c.namaOrg,c.deskripsi,
          c.target,c.terkumpul,c.tgl_mulai||c.tglMulai||null,c.tgl_selesai||c.tglSelesai||null,
          c.wa_number||c.waNumber,c.status,c.hero_image_url||c.heroImageUrl,
          c.quran_tersalurkan||c.quranTersalurkan,c.provinsi_terjangkau||c.provinsiTerjangkau,
          JSON.stringify(c.presets||[])])
    }
    if (Array.isArray(bam_donors) && bam_donors.length) {
      await client.query('DELETE FROM donors')
      for (const d of bam_donors) {
        await client.query(
          `INSERT INTO donors (id,nama,email,phone,kota,provinsi,jumlah,tanggal,doa,kategori,created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`,
          [d.id,d.nama,d.email||null,d.phone||null,d.kota||null,d.provinsi||null,
           d.jumlah,d.tanggal||null,d.doa||null,d.kategori,d.created_at||d.createdAt||new Date()]
        )
      }
    }
    if (Array.isArray(bam_updates) && bam_updates.length) {
      await client.query('DELETE FROM updates')
      for (const u of bam_updates) {
        await client.query(
          `INSERT INTO updates (id,tanggal,judul,deskripsi,thumbnail_url,created_at)
           VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
          [u.id,u.tanggal,u.judul,u.deskripsi||null,u.thumbnail_url||u.thumbnailUrl||null,
           u.created_at||u.createdAt||new Date()]
        )
      }
    }
    if (Array.isArray(bam_faq) && bam_faq.length) {
      await client.query('DELETE FROM faqs')
      for (let i = 0; i < bam_faq.length; i++) {
        const f = bam_faq[i]
        await client.query(
          `INSERT INTO faqs (id,pertanyaan,jawaban,order_index,created_at)
           VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
          [f.id,f.pertanyaan,f.jawaban,i,f.created_at||f.createdAt||new Date()]
        )
      }
    }
    await client.query('COMMIT')
    res.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true, db: 'connected', env: IS_VERCEL ? 'vercel' : 'local', time: new Date().toISOString() })
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message })
  }
})

// ── Start (local dev only — Vercel uses exported app) ────────
if (!IS_VERCEL) {
  app.listen(PORT, () => {
    console.log(`✅ BAM Backend running at http://localhost:${PORT}`)
    console.log(`   Health: http://localhost:${PORT}/api/health`)
  })
}

export default app
