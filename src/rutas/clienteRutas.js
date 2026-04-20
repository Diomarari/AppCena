const express = require('express')
const router = express.Router()
const { verificarRol } = require('../middlewares/authMiddleware')
const subir = require('../config/multer')
const {
    mostrarHome,
    mostrarComercios,
    mostrarCatalogo,
    mostrarConfirmarPedido,
    procesarCrearPedido,
    mostrarPedidos,
    mostrarDetallePedido,
    mostrarPerfil,
    procesarEditarPerfil,
    mostrarDirecciones,
    mostrarCrearDireccion,
    procesarCrearDireccion,
    mostrarEditarDireccion,
    procesarEditarDireccion,
    mostrarEliminarDireccion,
    procesarEliminarDireccion,
    mostrarFavoritos,
    toggleFavorito,
    removerFavorito
} = require('../controllers/clienteControlador')

const soloCliente = verificarRol('cliente')

router.get('/home', soloCliente, mostrarHome)
router.get('/comercios/:tipoId', soloCliente, mostrarComercios)
router.get('/catalogo/:comercioId', soloCliente, mostrarCatalogo)
router.get('/confirmar-pedido', soloCliente, mostrarConfirmarPedido)
router.post('/confirmar-pedido', soloCliente, procesarCrearPedido)
router.get('/pedidos', soloCliente, mostrarPedidos)
router.get('/pedidos/:id', soloCliente, mostrarDetallePedido)
router.get('/perfil', soloCliente, mostrarPerfil)
router.post('/perfil', soloCliente, subir.single('foto'), procesarEditarPerfil)
router.get('/direcciones', soloCliente, mostrarDirecciones)
router.get('/direcciones/crear', soloCliente, mostrarCrearDireccion)
router.post('/direcciones/crear', soloCliente, procesarCrearDireccion)
router.get('/direcciones/:id/editar', soloCliente, mostrarEditarDireccion)
router.post('/direcciones/:id/editar', soloCliente, procesarEditarDireccion)
router.get('/direcciones/:id/eliminar', soloCliente, mostrarEliminarDireccion)
router.post('/direcciones/:id/eliminar', soloCliente, procesarEliminarDireccion)
router.get('/favoritos', soloCliente, mostrarFavoritos)
router.post('/favoritos/:comercioId/toggle', soloCliente, toggleFavorito)
router.post('/favoritos/:comercioId/remover', soloCliente, removerFavorito)

module.exports = router