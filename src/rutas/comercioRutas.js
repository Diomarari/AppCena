const express = require('express')
const router = express.Router()
const { verificarRol } = require('../middlewares/authMiddleware')
const subir = require('../config/multer')
const {
    mostrarHome,
    mostrarDetallePedido,
    asignarDelivery,
    mostrarPerfil,
    procesarEditarPerfil,
    mostrarCategorias,
    mostrarCrearCategoria,
    procesarCrearCategoria,
    mostrarEditarCategoria,
    procesarEditarCategoria,
    mostrarEliminarCategoria,
    procesarEliminarCategoria,
    mostrarProductos,
    mostrarCrearProducto,
    procesarCrearProducto,
    mostrarEditarProducto,
    procesarEditarProducto,
    mostrarEliminarProducto,
    procesarEliminarProducto
} = require('../controllers/comercioControlador')

const soloComercio = verificarRol('comercio')

router.get('/home', soloComercio, mostrarHome)
router.get('/pedidos/:id', soloComercio, mostrarDetallePedido)
router.post('/pedidos/:id/asignar-delivery', soloComercio, asignarDelivery)
router.get('/perfil', soloComercio, mostrarPerfil)
router.post('/perfil', soloComercio, subir.single('logo'), procesarEditarPerfil)
router.get('/categorias', soloComercio, mostrarCategorias)
router.get('/categorias/crear', soloComercio, mostrarCrearCategoria)
router.post('/categorias/crear', soloComercio, procesarCrearCategoria)
router.get('/categorias/:id/editar', soloComercio, mostrarEditarCategoria)
router.post('/categorias/:id/editar', soloComercio, procesarEditarCategoria)
router.get('/categorias/:id/eliminar', soloComercio, mostrarEliminarCategoria)
router.post('/categorias/:id/eliminar', soloComercio, procesarEliminarCategoria)
router.get('/productos', soloComercio, mostrarProductos)
router.get('/productos/crear', soloComercio, mostrarCrearProducto)
router.post('/productos/crear', soloComercio, subir.single('foto'), procesarCrearProducto)
router.get('/productos/:id/editar', soloComercio, mostrarEditarProducto)
router.post('/productos/:id/editar', soloComercio, subir.single('foto'), procesarEditarProducto)
router.get('/productos/:id/eliminar', soloComercio, mostrarEliminarProducto)
router.post('/productos/:id/eliminar', soloComercio, procesarEliminarProducto)

module.exports = router