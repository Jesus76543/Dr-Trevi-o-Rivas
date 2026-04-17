const pool = require('./db')
const bcrypt = require('bcryptjs')

const seed = async () => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Usuarios iniciales
    const passDoctor = await bcrypt.hash('doctor123', 10)
    const passRecepcion = await bcrypt.hash('recepcion123', 10)

    await client.query(`
      INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
      ('Dr. Luis Arturo Treviño', 'doctor@consultorio.com', $1, 'doctor'),
      ('Recepción', 'recepcion@consultorio.com', $2, 'recepcion')
      ON CONFLICT (email) DO NOTHING
    `, [passDoctor, passRecepcion])

    // Pacientes de prueba
    await client.query(`
      INSERT INTO pacientes (nombre, apellidos, fecha_nacimiento, sexo, telefono, alergias, antecedentes) VALUES
      ('Ana', 'García López', '1994-05-12', 'F', '618-100-0001', 'Penicilina', 'Hipertensión leve'),
      ('Carlos', 'Hernández Ramos', '1979-11-23', 'M', '618-100-0002', 'Ninguna', 'Diabetes tipo 2'),
      ('Juan', 'Martínez García', '1990-03-08', 'M', '618-100-0003', 'Ibuprofeno', 'Sin antecedentes relevantes'),
      ('Sofía', 'Ramírez Vega', '1986-07-19', 'F', '618-100-0004', 'Látex', 'Operada de apéndice 2018'),
      ('Elena', 'Torres Mendoza', '2001-01-30', 'F', '618-100-0005', 'Ninguna', 'Sin antecedentes')
      ON CONFLICT DO NOTHING
    `)

    // Catálogo de costos
    await client.query(`
      INSERT INTO catalogo_costos (nombre, descripcion, monto) VALUES
      ('Consulta general', 'Consulta médica general', 800),
      ('Consulta de seguimiento', 'Revisión de paciente ya atendido', 500),
      ('Procedimiento menor', 'Curación, inyección, etc.', 600),
      ('Cirugía', 'Procedimiento quirúrgico', 15000)
      ON CONFLICT DO NOTHING
    `)

    // Citas de hoy
    const hoy = new Date().toISOString().split('T')[0]
    const res = await client.query('SELECT id FROM pacientes ORDER BY id LIMIT 5')
    const pIds = res.rows.map(r => r.id)

    if (pIds.length >= 5) {
      await client.query(`
        INSERT INTO citas (paciente_id, fecha, hora_inicio, hora_fin, tipo, estado) VALUES
        ($1, $6, '09:00', '09:30', 'consulta', 'atendida'),
        ($2, $6, '09:30', '10:00', 'consulta', 'atendida'),
        ($3, $6, '10:00', '10:30', 'consulta', 'en_consulta'),
        ($4, $6, '11:00', '13:00', 'cirugia', 'programada'),
        ($5, $6, '14:00', '14:30', 'seguimiento', 'en_espera')
      `, [...pIds, hoy])
    }

    await client.query('COMMIT')
    console.log('✅ Seed completado')
    console.log('👨‍⚕️  Doctor:    doctor@consultorio.com / doctor123')
    console.log('🏥  Recepción: recepcion@consultorio.com / recepcion123')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error en seed:', err)
    throw err
  } finally {
    client.release()
    pool.end()
  }
}

seed()
