const pool = require('../config/db')

const resumenDia = async (req, res) => {
  const hoy = new Date().toISOString().split('T')[0]
  const fecha = req.query.fecha || hoy

  const pagos = await pool.query(
    `SELECT pg.*, p.nombre, p.apellidos
     FROM pagos pg JOIN pacientes p ON pg.paciente_id = p.id
     WHERE DATE(pg.creado_en) = $1 ORDER BY pg.creado_en DESC`,
    [fecha]
  )

  const totales = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN estado='cobrado' THEN monto ELSE 0 END), 0) AS cobrado,
       COALESCE(SUM(CASE WHEN estado='pendiente' THEN monto ELSE 0 END), 0) AS pendiente,
       COUNT(CASE WHEN estado='cobrado' THEN 1 END) AS cobros_realizados
     FROM pagos WHERE DATE(creado_en) = $1`,
    [fecha]
  )

  res.json({ pagos: pagos.rows, totales: totales.rows[0] })
}

const cobrar = async (req, res) => {
  const { id } = req.params
  const { metodo_pago } = req.body
  const result = await pool.query(
    `UPDATE pagos SET estado='cobrado', metodo_pago=$1, cobrado_en=NOW()
     WHERE id=$2 RETURNING *`,
    [metodo_pago || 'efectivo', id]
  )
  if (!result.rows[0]) return res.status(404).json({ error: 'Pago no encontrado' })

  // Actualizar consulta
  await pool.query(
    'UPDATE consultas SET cobro_realizado=true WHERE id=$1',
    [result.rows[0].consulta_id]
  )
  res.json(result.rows[0])
}

const catalogo = async (req, res) => {
  const result = await pool.query('SELECT * FROM catalogo_costos WHERE activo=true ORDER BY nombre')
  res.json(result.rows)
}

module.exports = { resumenDia, cobrar, catalogo }
