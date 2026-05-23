import { Router } from 'express'
import pool from '../db.js'
import { requireApiKey } from '../middleware/auth.js'

const router = Router()

// GET /api/donors — protected (admin reads donor data)
// Query params: search, provinsi, kategori, sort, order, page, limit
router.get('/', requireApiKey, async (req, res) => {
  const {
    search = '', provinsi = '', kategori = '',
    sort = 'tanggal', order = 'desc',
    page = 1, limit = 50,
  } = req.query

  const conditions = []
  const params = []
  let idx = 1

  if (search) {
    conditions.push(`(nama ILIKE $${idx} OR email ILIKE $${idx} OR kota ILIKE $${idx})`)
    params.push(`%${search}%`)
    idx++
  }
  if (provinsi) {
    conditions.push(`provinsi = $${idx}`)
    params.push(provinsi)
    idx++
  }
  if (kategori) {
    conditions.push(`kategori = $${idx}`)
    params.push(kategori)
    idx++
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const validSort = ['nama','jumlah','tanggal','kota','provinsi','kategori'].includes(sort) ? sort : 'tanggal'
  const validOrder = order === 'asc' ? 'ASC' : 'DESC'
  const offset = (Number(page) - 1) * Number(limit)

  try {
    const countRes = await pool.query(`SELECT COUNT(*) FROM donors ${where}`, params)
    const total = Number(countRes.rows[0].count)

    const { rows } = await pool.query(
      `SELECT * FROM donors ${where} ORDER BY ${validSort} ${validOrder} LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, Number(limit), offset]
    )
    res.json({ total, page: Number(page), limit: Number(limit), data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/donors — protected
router.post('/', requireApiKey, async (req, res) => {
  const b = req.body
  try {
    await pool.query(
      `INSERT INTO donors (id, nama, email, phone, kota, provinsi, jumlah, tanggal, doa, kategori, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [b.id, b.nama, b.email||null, b.phone||null, b.kota||null, b.provinsi||null,
       b.jumlah, b.tanggal||null, b.doa||null, b.kategori, b.createdAt||new Date().toISOString()]
    )
    res.status(201).json({ ok: true, id: b.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/donors/:id — protected
router.put('/:id', requireApiKey, async (req, res) => {
  const b = req.body
  try {
    const { rowCount } = await pool.query(
      `UPDATE donors SET nama=$1, email=$2, phone=$3, kota=$4, provinsi=$5,
       jumlah=$6, tanggal=$7, doa=$8, kategori=$9 WHERE id=$10`,
      [b.nama, b.email||null, b.phone||null, b.kota||null, b.provinsi||null,
       b.jumlah, b.tanggal||null, b.doa||null, b.kategori, req.params.id]
    )
    if (rowCount === 0) return res.status(404).json({ error: 'Donor not found' })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/donors/:id — protected
router.delete('/:id', requireApiKey, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM donors WHERE id=$1', [req.params.id])
    if (rowCount === 0) return res.status(404).json({ error: 'Donor not found' })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

export default router
