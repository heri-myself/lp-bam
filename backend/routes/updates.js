import { Router } from 'express'
import pool from '../db.js'
import { requireApiKey } from '../middleware/auth.js'

const router = Router()

// GET /api/updates — public
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM updates ORDER BY tanggal DESC')
    res.json(rows.map(r => ({
      id:           r.id,
      tanggal:      r.tanggal ? r.tanggal.toISOString().split('T')[0] : null,
      judul:        r.judul,
      deskripsi:    r.deskripsi,
      thumbnailUrl: r.thumbnail_url,
      createdAt:    r.created_at,
    })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/updates — protected
router.post('/', requireApiKey, async (req, res) => {
  const b = req.body
  try {
    await pool.query(
      `INSERT INTO updates (id, tanggal, judul, deskripsi, thumbnail_url, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [b.id, b.tanggal, b.judul, b.deskripsi||null, b.thumbnailUrl||null,
       b.createdAt||new Date().toISOString()]
    )
    res.status(201).json({ ok: true, id: b.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/updates/:id — protected
router.put('/:id', requireApiKey, async (req, res) => {
  const b = req.body
  try {
    const { rowCount } = await pool.query(
      `UPDATE updates SET tanggal=$1, judul=$2, deskripsi=$3, thumbnail_url=$4 WHERE id=$5`,
      [b.tanggal, b.judul, b.deskripsi||null, b.thumbnailUrl||null, req.params.id]
    )
    if (rowCount === 0) return res.status(404).json({ error: 'Update not found' })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/updates/:id — protected
router.delete('/:id', requireApiKey, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM updates WHERE id=$1', [req.params.id])
    if (rowCount === 0) return res.status(404).json({ error: 'Update not found' })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

export default router
