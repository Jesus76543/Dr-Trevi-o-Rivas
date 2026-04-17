const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.usuario = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

const soloDoctor = (req, res, next) => {
  if (req.usuario.rol !== 'doctor') {
    return res.status(403).json({ error: 'Solo el doctor puede realizar esta acción' })
  }
  next()
}

module.exports = { authMiddleware, soloDoctor }
