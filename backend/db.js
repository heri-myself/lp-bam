import pg from 'pg'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: join(dirname(fileURLToPath(import.meta.url)), '.env') })

const { Pool } = pg

if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL is not set — all DB queries will fail until configured.')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost/placeholder',
})

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err.message)
})

export default pool
