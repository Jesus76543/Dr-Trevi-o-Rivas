const { Pool } = require('pg')
require('dotenv').config()

const isProduction = process.env.NODE_ENV === 'production'

const pool = new Pool({
  // Si existe DATABASE_URL (en Render), la usa completa. 
  // Si no, usa tus variables locales una por una.
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false
})

pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL')
})

pool.on('error', (err) => {
  console.error('❌ Error en la base de datos:', err)
  // No cerramos el proceso en producción para que el servidor no se caiga
  if (!isProduction) process.exit(-1)
})

module.exports = pool