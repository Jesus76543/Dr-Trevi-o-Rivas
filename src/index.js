require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const pool = require('./config/db')
const routes = require('./routes')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
})

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use((req, res, next) => {
  req.io = io
  next()
})

app.use('/api', routes)

// Historial en memoria
const historialMensajes = []
const MAX_HISTORIAL = 100

io.on('connection', (socket) => {
  console.log('🔌 Usuario conectado:', socket.id)
  socket.emit('historial_chat', historialMensajes)

  socket.on('mensaje_chat', (data) => {
    const msg = { ...data, id: Date.now(), timestamp: new Date().toISOString() }
    historialMensajes.push(msg)
    if (historialMensajes.length > MAX_HISTORIAL) historialMensajes.shift()
    io.emit('mensaje_chat', msg)
  })

  socket.on('siguiente_paciente', (data) => {
    io.emit('siguiente_paciente', { ...data, timestamp: new Date().toISOString() })
  })

  socket.on('disconnect', () => {
    console.log('🔌 Usuario desconectado:', socket.id)
  })
})

// Corregir nombre del doctor al arrancar (por si quedó el nombre de prueba)
const fixDoctorName = async () => {
  try {
    const r = await pool.query(
      `UPDATE usuarios
       SET nombre = 'Dr. Luis Arturo Treviño'
       WHERE email = 'doctor@consultorio.com'
         AND nombre != 'Dr. Luis Arturo Treviño'`
    )
    if (r.rowCount > 0) console.log('✅ Nombre del doctor actualizado')
  } catch (e) {
    // No bloquear el arranque si falla
  }
}

const PORT = process.env.PORT || 4000
server.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
  await fixDoctorName()
})
