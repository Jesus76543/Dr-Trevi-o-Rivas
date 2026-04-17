// Ejecuta: node src/config/fix_doctor_name.js
// Solo si ya tienes la base de datos corriendo con el nombre anterior

require('dotenv').config()
const pool = require('./db')

pool.query(
  `UPDATE usuarios SET nombre = 'Dr. Luis Arturo Treviño' WHERE email = 'doctor@consultorio.com'`
).then(r => {
  console.log(`✅ Nombre actualizado (${r.rowCount} fila)`)
  pool.end()
}).catch(e => {
  console.error('❌', e.message)
  pool.end()
})
