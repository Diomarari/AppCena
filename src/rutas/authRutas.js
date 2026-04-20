const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const subir = require('../config/multer')
const { redirigirSiLogueado } = require('../middlewares/authMiddleware')
const {
    mostrarLogin,
    procesarLogin,
    mostrarRegistro,
    procesarRegistro,
    mostrarRegistroComercio,
    procesarRegistroComercio,
    activarCuenta,
    mostrarOlvideClave,
    procesarOlvideClave,
    mostrarNuevaClave,
    procesarNuevaClave,
    cerrarSesion
} = require('../controllers/authControlador')

const validarLogin = [
    body('identificador').notEmpty().withMessage('El correo o usuario es requerido.'),
    body('contrasena').notEmpty().withMessage('La contraseña es requerida.')
]

const validarRegistro = [
    body('nombre').notEmpty().withMessage('El nombre es requerido.'),
    body('apellido').notEmpty().withMessage('El apellido es requerido.'),
    body('telefono').notEmpty().withMessage('El teléfono es requerido.'),
    body('correo').isEmail().withMessage('Ingresa un correo válido.'),
    body('nombreUsuario').notEmpty().withMessage('El nombre de usuario es requerido.'),
    body('rol').isIn(['cliente', 'delivery']).withMessage('Selecciona un rol válido.'),
    body('contrasena').notEmpty().withMessage('La contraseña es requerida.'),
    body('confirmarContrasena').custom((valor, { req }) => {
        if (valor !== req.body.contrasena) throw new Error('Las contraseñas no coinciden.')
        return true
    })
]

const validarRegistroComercio = [
    body('nombreComercio').notEmpty().withMessage('El nombre del comercio es requerido.'),
    body('telefono').notEmpty().withMessage('El teléfono es requerido.'),
    body('correo').isEmail().withMessage('Ingresa un correo válido.'),
    body('horaApertura').notEmpty().withMessage('La hora de apertura es requerida.'),
    body('horaCierre').notEmpty().withMessage('La hora de cierre es requerida.'),
    body('tipoComercio').notEmpty().withMessage('Selecciona un tipo de comercio.'),
    body('contrasena').notEmpty().withMessage('La contraseña es requerida.'),
    body('confirmarContrasena').custom((valor, { req }) => {
        if (valor !== req.body.contrasena) throw new Error('Las contraseñas no coinciden.')
        return true
    })
]

router.get('/', redirigirSiLogueado, mostrarLogin)
router.post('/', redirigirSiLogueado, validarLogin, procesarLogin)
router.get('/registro', redirigirSiLogueado, mostrarRegistro)
router.post('/registro', redirigirSiLogueado, subir.single('foto'), validarRegistro, procesarRegistro)
router.get('/registro-comercio', redirigirSiLogueado, mostrarRegistroComercio)
router.post('/registro-comercio', redirigirSiLogueado, subir.single('logo'), validarRegistroComercio, procesarRegistroComercio)
router.get('/activar/:token', activarCuenta)
router.get('/olvide-clave', redirigirSiLogueado, mostrarOlvideClave)
router.post('/olvide-clave', procesarOlvideClave)
router.get('/nueva-clave/:token', mostrarNuevaClave)
router.post('/nueva-clave/:token', procesarNuevaClave)
router.get('/cerrar-sesion', cerrarSesion)

module.exports = router