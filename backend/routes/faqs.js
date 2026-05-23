import { Router } from 'express'
import pool from '../db.js'
import { requireApiKey } from '../middleware/auth.js'

const router = Router()

// GET /api/faqs — public
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM faqs ORDER BY order_index ASC')
    res.json(rows.map(r => ({
      id:          r.id,
      pertanyaan:  r.pertanyaan,
      jawaban:     r.jawaban,
      orderIndex:  r.order_index,
      createdAt:   r.created_at,
    })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/faqs — protected
router.post('/', requireApiKey, async (req, res) => {
  const b = req.body
  try {
    // Auto-assign order_index as max+1
    const { rows: maxRows } = await pool.query('SELECT COALESCE(MAX(order_index), -1) AS m FROM faqs')
    const orderIndex = maxRows[0].m + 1
    await pool.query(
      `INSERT INTO faqs (id, pertanyaan, jawaban, order_index, created_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [b.id, b.pertanyaan, b.jawaban, orderIndex, b.createdAt||new Date().toISOString()]
    )
    res.status(201).json({ ok: true, id: b.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/faqs/:id — protected (edit content)
router.put('/:id', requireApiKey, async (req, res) => {
  const b = req.body
  try {
    const { rowCount } = await pool.query(
      `UPDATE faqs SET pertanyaan=$1, jawaban=$2 WHERE id=$3`,
      [b.pertanyaan, b.jawaban, req.params.id]
    )
    if (rowCount === 0) return res.status(404).json({ error: 'FAQ not found' })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/faqs/:id/order — protected (reorder: swap with neighbor)
router.put('/:id/order', requireApiKey, async (req, res) => {
  const { direction } = req.body  // 'up' | 'down'
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query('SELECT * FROM faqs ORDER BY order_index ASC')
    const idx = rows.findIndex(r => r.id === req.params.id)
    if (idx === -1) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }) }
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= rows.length) {
      await client.query('ROLLBACK')
      return res.json({ ok: true, unchanged: true })
    }
    const a = rows[idx], b = rows[swapIdx]
    await client.query('UPDATE faqs SET order_index=$1 WHERE id=$2', [b.order_index, a.id])
    await client.query('UPDATE faqs SET order_index=$1 WHERE id=$2', [a.order_index, b.id])
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

// DELETE /api/faqs/:id — protected
router.delete('/:id', requireApiKey, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM faqs WHERE id=$1', [req.params.id])
    if (rowCount === 0) return res.status(404).json({ error: 'FAQ not found' })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

export default router
