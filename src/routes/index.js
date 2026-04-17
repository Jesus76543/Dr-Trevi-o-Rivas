const router = require('express').Router()
const { authMiddleware, soloDoctor } = require('../middleware/auth')
const { login } = require('../controllers/authController')
const pacientes = require('../controllers/pacientesController')
const citas = require('../controllers/citasController')
const consultas = require('../controllers/consultasController')
const caja = require('../controllers/cajaController')

// Auth
router.post('/auth/login', login)

// Pacientes
router.get('/pacientes', authMiddleware, pacientes.listar)
router.get('/pacientes/:id', authMiddleware, pacientes.obtener)
router.post('/pacientes', authMiddleware, pacientes.crear)
router.put('/pacientes/:id', authMiddleware, pacientes.actualizar)

// Citas
router.get('/citas', authMiddleware, citas.listarHoy)
router.post('/citas', authMiddleware, citas.crear)
router.patch('/citas/:id/estado', authMiddleware, citas.actualizarEstado)

// Consultas (solo doctor puede crear)
router.post('/consultas', authMiddleware, soloDoctor, consultas.crear)
router.get('/consultas/paciente/:paciente_id', authMiddleware, consultas.listarPorPaciente)

// Caja
router.get('/caja/resumen', authMiddleware, caja.resumenDia)
router.patch('/caja/pagos/:id/cobrar', authMiddleware, caja.cobrar)
router.get('/caja/catalogo', authMiddleware, caja.catalogo)

module.exports = router
