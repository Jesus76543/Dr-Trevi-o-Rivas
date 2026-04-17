const pool = require('./db')

const migrate = async () => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Usuarios del sistema (recepcion y doctor)
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        rol VARCHAR(20) NOT NULL CHECK (rol IN ('doctor', 'recepcion')),
        activo BOOLEAN DEFAULT true,
        creado_en TIMESTAMP DEFAULT NOW()
      )
    `)

    // Pacientes
    await client.query(`
      CREATE TABLE IF NOT EXISTS pacientes (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        apellidos VARCHAR(100) NOT NULL,
        fecha_nacimiento DATE,
        sexo CHAR(1) CHECK (sexo IN ('M', 'F', 'O')),
        telefono VARCHAR(20),
        email VARCHAR(100),
        alergias TEXT,
        antecedentes TEXT,
        notas_generales TEXT,
        creado_en TIMESTAMP DEFAULT NOW(),
        actualizado_en TIMESTAMP DEFAULT NOW()
      )
    `)

    // Citas
    await client.query(`
      CREATE TABLE IF NOT EXISTS citas (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
        fecha DATE NOT NULL,
        hora_inicio TIME NOT NULL,
        hora_fin TIME NOT NULL,
        tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('consulta', 'cirugia', 'seguimiento', 'procedimiento')),
        estado VARCHAR(20) DEFAULT 'programada' CHECK (estado IN ('programada', 'en_espera', 'en_consulta', 'atendida', 'cancelada')),
        notas VARCHAR(500),
        creado_en TIMESTAMP DEFAULT NOW()
      )
    `)

    // Consultas / Expediente clínico
    await client.query(`
      CREATE TABLE IF NOT EXISTS consultas (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
        cita_id INTEGER REFERENCES citas(id),
        doctor_id INTEGER REFERENCES usuarios(id),
        fecha TIMESTAMP DEFAULT NOW(),
        motivo TEXT,
        diagnostico TEXT,
        plan TEXT,
        receta TEXT,
        monto NUMERIC(10,2),
        cobro_enviado BOOLEAN DEFAULT false,
        cobro_realizado BOOLEAN DEFAULT false,
        creado_en TIMESTAMP DEFAULT NOW()
      )
    `)

    // Pagos / Caja
    await client.query(`
      CREATE TABLE IF NOT EXISTS pagos (
        id SERIAL PRIMARY KEY,
        consulta_id INTEGER REFERENCES consultas(id),
        paciente_id INTEGER REFERENCES pacientes(id),
        concepto VARCHAR(200),
        monto NUMERIC(10,2) NOT NULL,
        metodo_pago VARCHAR(30) DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
        estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'cobrado', 'cancelado')),
        cobrado_en TIMESTAMP,
        creado_en TIMESTAMP DEFAULT NOW()
      )
    `)

    // Catálogo de costos
    await client.query(`
      CREATE TABLE IF NOT EXISTS catalogo_costos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        monto NUMERIC(10,2) NOT NULL,
        activo BOOLEAN DEFAULT true
      )
    `)

    // Mensajes del chat interno
    await client.query(`
      CREATE TABLE IF NOT EXISTS mensajes (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        contenido TEXT NOT NULL,
        tipo VARCHAR(20) DEFAULT 'texto' CHECK (tipo IN ('texto', 'alerta_cobro', 'alerta_paciente')),
        metadata JSONB,
        leido BOOLEAN DEFAULT false,
        creado_en TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query('COMMIT')
    console.log('✅ Migración completada exitosamente')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error en migración:', err)
    throw err
  } finally {
    client.release()
    pool.end()
  }
}

migrate()
