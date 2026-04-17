const pool = require('../config/db')

const listar = async (req, res) => {
  const { buscar } = req.query
  let query = 'SELECT * FROM pacientes'
  let params = []
  if (buscar) {
    query += ' WHERE nombre ILIKE $1 OR apellidos ILIKE $1'
    params = [`%${buscar}%`]
  }
  query += ' ORDER BY apellidos, nombre'
  const result = await pool.query(query, params)
  res.json(result.rows)
}

const obtener = async (req, res) => {
  const { id } = req.params
  const paciente = await pool.query('SELECT * FROM pacientes WHERE id = $1', [id])
  if (!paciente.rows[0]) return res.status(404).json({ error: 'Paciente no encontrado' })
  const consultas = await pool.query(
    'SELECT * FROM consultas WHERE paciente_id = $1 ORDER BY fecha DESC',
    [id]
  )
  res.json({ ...paciente.rows[0], consultas: consultas.rows })
}

const crear = async (req, res) => {
  const { nombre, apellidos, fecha_nacimiento, sexo, telefono, email, alergias, antecedentes, notas_generales } = req.body
  const result = await pool.query(
    `INSERT INTO pacientes (nombre, apellidos, fecha_nacimiento, sexo, telefono, email, alergias, antecedentes, notas_generales)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [nombre, apellidos, fecha_nacimiento, sexo, telefono, email, alergias, antecedentes, notas_generales]
  )
  res.status(201).json(result.rows[0])
}

const actualizar = async (req, res) => {
  const { id } = req.params
  const { nombre, apellidos, fecha_nacimiento, sexo, telefono, email, alergias, antecedentes, notas_generales } = req.body
  const result = await pool.query(
    `UPDATE pacientes SET nombre=$1, apellidos=$2, fecha_nacimiento=$3, sexo=$4,
     telefono=$5, email=$6, alergias=$7, antecedentes=$8, notas_generales=$9,
     actualizado_en=NOW() WHERE id=$10 RETURNING *`,
    [nombre, apellidos, fecha_nacimiento, sexo, telefono, email, alergias, antecedentes, notas_generales, id]
  )
  if (!result.rows[0]) return res.status(404).json({ error: 'Paciente no encontrado' })
  res.json(result.rows[0])
}

module.exports = { listar, obtener, crear, actualizar }
