const pool = require('../config/db')

const listarHoy = async (req, res) => {
  const hoy = new Date().toISOString().split('T')[0]
  const fecha = req.query.fecha || hoy
  const result = await pool.query(
    `SELECT
       c.id, c.paciente_id, c.fecha,
       c.hora_inicio, c.hora_fin,
       c.tipo, c.estado, c.notas, c.creado_en,
       p.nombre, p.apellidos, p.telefono, p.alergias
     FROM citas c
     JOIN pacientes p ON c.paciente_id = p.id
     WHERE c.fecha = $1
     ORDER BY c.hora_inicio`,
    [fecha]
  )
  res.json(result.rows)
}

const crear = async (req, res) => {
  const { paciente_id, fecha, hora_inicio, hora_fin, tipo, notas } = req.body
  const conflicto = await pool.query(
    `SELECT id FROM citas
     WHERE fecha = $1
       AND estado != 'cancelada'
       AND (hora_inicio, hora_fin) OVERLAPS ($2::time, $3::time)`,
    [fecha, hora_inicio, hora_fin]
  )
  if (conflicto.rows.length > 0) {
    return res.status(409).json({ error: 'Ya existe una cita en ese horario' })
  }
  const result = await pool.query(
    `INSERT INTO citas (paciente_id, fecha, hora_inicio, hora_fin, tipo, notas)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [paciente_id, fecha, hora_inicio, hora_fin, tipo, notas]
  )
  res.status(201).json(result.rows[0])
}

const actualizarEstado = async (req, res) => {
  const { id } = req.params
  const { estado } = req.body
  const result = await pool.query(
    'UPDATE citas SET estado=$1 WHERE id=$2 RETURNING *',
    [estado, id]
  )
  if (!result.rows[0]) return res.status(404).json({ error: 'Cita no encontrada' })
  res.json(result.rows[0])
}

module.exports = { listarHoy, crear, actualizarEstado }
