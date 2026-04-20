const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const { verificarRol } = require('../middlewares/authMiddleware')
const subir = require('../config/multer')
const {
    mostrarDashboard,
    listarClientes,
    listarDeliveries,
    listarComercios,
    cambiarEstadoUsuario,
    mostrarConfiguracion,
    mostrarEditarConfiguracion,
    procesarEditarConfiguracion,
    listarAdministradores,
    mostrarCrearAdmin,
    procesarCrearAdmin,
    mostrarEditarAdmin,
    procesarEditarAdmin,
    cambiarEstadoAdmin,
    listarTiposComercios,
    mostrarCrearTipo,
    procesarCrearTipo,
    mostrarEditarTipo,
    procesarEditarTipo,
    mostrarEliminarTipo,
    procesarEliminarTipo
} = require('../controllers/adminControlador')

const soloAdmin = verificarRol('admin')

const validarAdmin = [
    body('nombre').notEmpty().withMessage('El nombre es requerido.'),
    body('apellido').notEmpty().withMessage('El apellido es requerido.'),
    body('cedula').notEmpty().withMessage('La cédula es requerida.'),
    body('correo').isEmail().withMessage('Ingresa un correo válido.'),
    body('nombreUsuario').notEmpty().withMessage('El nombre de usuario es requerido.'),
    body('contrasena').notEmpty().withMessage('La contraseña es requerida.')
]

router.get('/home', soloAdmin, mostrarDashboard)
router.get('/clientes', soloAdmin, listarClientes)
router.get('/deliveries', soloAdmin, listarDeliveries)
router.get('/comercios', soloAdmin, listarComercios)
router.post('/usuario/:id/estado', soloAdmin, cambiarEstadoUsuario)
router.get('/configuracion', soloAdmin, mostrarConfiguracion)
router.get('/configuracion/editar', soloAdmin, mostrarEditarConfiguracion)
router.post('/configuracion/editar', soloAdmin, procesarEditarConfiguracion)
router.get('/administradores', soloAdmin, listarAdministradores)
router.get('/administradores/crear', soloAdmin, mostrarCrearAdmin)
router.post('/administradores/crear', soloAdmin, validarAdmin, procesarCrearAdmin)
router.get('/administradores/:id/editar', soloAdmin, mostrarEditarAdmin)
router.post('/administradores/:id/editar', soloAdmin, validarAdmin, procesarEditarAdmin)
router.post('/administradores/:id/estado', soloAdmin, cambiarEstadoAdmin)
router.get('/tipos-comercio', soloAdmin, listarTiposComercios)
router.get('/tipos-comercio/crear', soloAdmin, mostrarCrearTipo)
router.post('/tipos-comercio/crear', soloAdmin, subir.single('icono'), procesarCrearTipo)
router.get('/tipos-comercio/:id/editar', soloAdmin, mostrarEditarTipo)
router.post('/tipos-comercio/:id/editar', soloAdmin, subir.single('icono'), procesarEditarTipo)
router.get('/tipos-comercio/:id/eliminar', soloAdmin, mostrarEliminarTipo)
router.post('/tipos-comercio/:id/eliminar', soloAdmin, procesarEliminarTipo)

module.exports = router