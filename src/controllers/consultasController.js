const pool = require('../config/db')

const crear = async (req, res) => {
  const { paciente_id, cita_id, motivo, diagnostico, plan, receta, monto } = req.body
  const doctor_id = req.usuario.id

  try {
    const result = await pool.query(
      `INSERT INTO consultas (paciente_id, cita_id, doctor_id, motivo, diagnostico, plan, receta, monto)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [paciente_id, cita_id, doctor_id, motivo, diagnostico, plan, receta, monto]
    )
    const consulta = result.rows[0]

    if (monto && Number(monto) > 0) {
      // Guardar pago pendiente
      await pool.query(
        `INSERT INTO pagos (consulta_id, paciente_id, concepto, monto, estado)
         VALUES ($1,$2,'Consulta médica',$3,'pendiente')`,
        [consulta.id, paciente_id, monto]
      )
      await pool.query('UPDATE consultas SET cobro_enviado=true WHERE id=$1', [consulta.id])

      // Emitir alerta de cobro a recepción via socket
      const pacienteRes = await pool.query(
        'SELECT nombre, apellidos FROM pacientes WHERE id=$1',
        [paciente_id]
      )
      const p = pacienteRes.rows[0]
      if (p && req.io) {
        const payload = {
          mensaje: `Cobrar $${Number(monto).toLocaleString('es-MX')}`,
          paciente: `${p.apellidos}, ${p.nombre}`,
          monto: Number(monto),
          consulta_id: consulta.id,
        }
        req.io.emit('alerta_cobro', payload)
        console.log('💰 Alerta cobro emitida:', payload.mensaje, '—', payload.paciente)
      }
    }

    res.status(201).json(consulta)
  } catch (e) {
    console.error('Error al crear consulta:', e.message)
    res.status(500).json({ error: 'Error al guardar la consulta' })
  }
}

const listarPorPaciente = async (req, res) => {
  const { paciente_id } = req.params
  const result = await pool.query(
    'SELECT * FROM consultas WHERE paciente_id=$1 ORDER BY fecha DESC',
    [paciente_id]
  )
  res.json(result.rows)
}

module.exports = { crear, listarPorPaciente }
