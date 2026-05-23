import { Router } from 'express'
import pool from '../db.js'
import { requireApiKey } from '../middleware/auth.js'

const router = Router()

// GET /api/campaign — public
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM campaign WHERE id = 1')
    if (rows.length === 0) return res.json(null)
    const c = rows[0]
    // Normalize to camelCase for frontend compatibility
    res.json({
      namaCampaign:        c.nama_campaign,
      namaOrg:             c.nama_org,
      deskripsi:           c.deskripsi,
      target:              Number(c.target),
      terkumpul:           Number(c.terkumpul),
      tglMulai:            c.tgl_mulai ? c.tgl_mulai.toISOString().split('T')[0] : null,
      tglSelesai:          c.tgl_selesai ? c.tgl_selesai.toISOString().split('T')[0] : null,
      waNumber:            c.wa_number,
      status:              c.status,
      heroImageUrl:        c.hero_image_url,
      quranTersalurkan:    c.quran_tersalurkan,
      provinsiTerjangkau:  c.provinsi_terjangkau,
      presets:             c.presets,
      updatedAt:           c.updated_at,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/campaign — protected
router.put('/', requireApiKey, async (req, res) => {
  const b = req.body
  try {
    const { rows } = await pool.query(`
      INSERT INTO campaign (
        id, nama_campaign, nama_org, deskripsi,
        target, terkumpul, tgl_mulai, tgl_selesai,
        wa_number, status, hero_image_url,
        quran_tersalurkan, provinsi_terjangkau, presets, updated_at
      ) VALUES (
        1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        nama_campaign        = EXCLUDED.nama_campaign,
        nama_org             = EXCLUDED.nama_org,
        deskripsi            = EXCLUDED.deskripsi,
        target               = EXCLUDED.target,
        terkumpul            = EXCLUDED.terkumpul,
        tgl_mulai            = EXCLUDED.tgl_mulai,
        tgl_selesai          = EXCLUDED.tgl_selesai,
        wa_number            = EXCLUDED.wa_number,
        status               = EXCLUDED.status,
        hero_image_url       = EXCLUDED.hero_image_url,
        quran_tersalurkan    = EXCLUDED.quran_tersalurkan,
        provinsi_terjangkau  = EXCLUDED.provinsi_terjangkau,
        presets              = EXCLUDED.presets,
        updated_at           = NOW()
      RETURNING *
    `, [
      b.namaCampaign, b.namaOrg, b.deskripsi,
      b.target, b.terkumpul, b.tglMulai || null, b.tglSelesai || null,
      b.waNumber, b.status, b.heroImageUrl,
      b.quranTersalurkan, b.provinsiTerjangkau,
      JSON.stringify(b.presets || [])
    ])
    res.json({ ok: true, updatedAt: rows[0].updated_at })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

export default router
