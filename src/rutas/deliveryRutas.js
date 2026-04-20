const express = require('express')
const router = express.Router()
const { verificarRol } = require('../middlewares/authMiddleware')
const subir = require('../config/multer')
const {
    mostrarHome,
    mostrarDetallePedido,
    completarPedido,
    mostrarPerfil,
    procesarEditarPerfil
} = require('../controllers/deliveryControlador')

const soloDelivery = verificarRol('delivery')

router.get('/home', soloDelivery, mostrarHome)
router.get('/pedidos/:id', soloDelivery, mostrarDetallePedido)
router.post('/pedidos/:id/completar', soloDelivery, completarPedido)
router.get('/perfil', soloDelivery, mostrarPerfil)
router.post('/perfil', soloDelivery, subir.single('foto'), procesarEditarPerfil)

module.exports = router