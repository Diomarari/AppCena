const Usuario = require('../modelos/Usuario')
const Comercio = require('../modelos/Comercio')
const TipoComercio = require('../modelos/TipoComercio')
const Configuracion = require('../modelos/Configuracion')
const { validationResult } = require('express-validator')
const { Resend } = require('resend')
const { v4: uuidv4 } = require('uuid')

// Configurar nodemailer

const resend = new Resend(process.env.RESEND_API_KEY)

// Función auxiliar para enviar correos

const enviarCorreo = async (para, asunto, html) => {
    await resend.emails.send({
        from: 'AppCenar <onboarding@resend.dev>',
        to: para,
        subject: asunto,
        html
    })
}
// Función para crear datos iniciales del sistema
const inicializarSistema = async () => {
    const configExiste = await Configuracion.findOne({ clave: 'ITBIS' })
    if (!configExiste) {
        await Configuracion.create({
            clave: 'ITBIS',
            valor: '18',
            descripcion: 'Porcentaje del ITBIS aplicado a los pedidos'
        })
        console.log('✅ Configuración ITBIS creada por defecto')
    }

    const adminExiste = await Usuario.findOne({ esAdminPorDefecto: true })
    if (!adminExiste) {
        await Usuario.create({
            nombre: 'Admin',
            apellido: 'Principal',
            correo: 'admin@appcenar.com',
            nombreUsuario: 'admin',
            contrasena: 'Admin123!',
            rol: 'admin',
            activo: true,
            esAdminPorDefecto: true
        })
        console.log('✅ Admin por defecto creado: admin / Admin123!')
    }
}


// GET /  - Mostrar login
const mostrarLogin = async (req, res) => {
    res.render('auth/login', { titulo: 'Iniciar Sesión' })
}

// POST / - Procesar login
const procesarLogin = async (req, res) => {
    const errores = validationResult(req)
    if (!errores.isEmpty()) {
        return res.render('auth/login', {
            titulo: 'Iniciar Sesión',
            error: errores.array().map(e => e.msg),
            datos: req.body
        })
    }

    const { identificador, contrasena } = req.body

    try {
        const usuario = await Usuario.findOne({
            $or: [
                { correo: identificador.toLowerCase() },
                { nombreUsuario: identificador }
            ]
        })

        if (!usuario) {
            return res.render('auth/login', {
                titulo: 'Iniciar Sesión',
                error: ['Los datos de acceso son incorrectos.'],
                datos: req.body
            })
        }

        if (!usuario.activo) {
            return res.render('auth/login', {
                titulo: 'Iniciar Sesión',
                error: ['Tu cuenta está inactiva. Revisa tu correo o contáctate con un administrador.'],
                datos: req.body
            })
        }

        const claveCorrecta = await usuario.compararContrasena(contrasena)
        if (!claveCorrecta) {
            return res.render('auth/login', {
                titulo: 'Iniciar Sesión',
                error: ['Los datos de acceso son incorrectos.'],
                datos: req.body
            })
        }

        // Guardar en sesión
        req.session.usuario = {
            id: usuario._id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo: usuario.correo,
            nombreUsuario: usuario.nombreUsuario,
            rol: usuario.rol,
            foto: usuario.foto
        }

        // Redirigir según rol
        if (usuario.rol === 'cliente') return res.redirect('/cliente/home')
        if (usuario.rol === 'comercio') return res.redirect('/comercio/home')
        if (usuario.rol === 'delivery') return res.redirect('/delivery/home')
        if (usuario.rol === 'admin') return res.redirect('/admin/home')

    } catch (error) {
        console.error(error)
        res.render('auth/login', {
            titulo: 'Iniciar Sesión',
            error: ['Ocurrió un error inesperado. Por favor intenta de nuevo.'],
            datos: req.body
        })
    }
}

// GET /registro - Mostrar formulario de registro cliente/delivery
const mostrarRegistro = async (req, res) => {
    res.render('auth/registro', { titulo: 'Crear cuenta' })
}

// POST /registro - Procesar registro cliente/delivery
const procesarRegistro = async (req, res) => {
    const errores = validationResult(req)
    if (!errores.isEmpty()) {
        return res.render('auth/registro', {
            titulo: 'Crear cuenta',
            error: errores.array().map(e => e.msg),
            datos: req.body
        })
    }

    const { nombre, apellido, telefono, correo, nombreUsuario, rol, contrasena } = req.body

    try {
        const usuarioExistente = await Usuario.findOne({
            $or: [
                { correo: correo.toLowerCase() },
                { nombreUsuario }
            ]
        })

        if (usuarioExistente) {
            return res.render('auth/registro', {
                titulo: 'Crear cuenta',
                error: ['El correo o nombre de usuario ya está en uso.'],
                datos: req.body
            })
        }

        const token = uuidv4()
        const foto = req.file ? req.file.filename : null

        const nuevoUsuario = await Usuario.create({
            nombre,
            apellido,
            telefono,
            correo,
            nombreUsuario,
            contrasena,
            rol,
            foto,
            activo: false,
            tokenActivacion: token,
            disponible: rol === 'delivery' ? true : undefined
        })

        const enlace = `${process.env.URL_APP}/activar/${token}`
        await enviarCorreo(
            correo,
            '¡Activa tu cuenta en AppCenar! 🍽️',
            `<h2>¡Hola, ${nombre}!</h2>
            <p>Ya casi estás listo/a. Solo falta activar tu cuenta haciendo clic en el enlace de abajo.</p>
            <a href="${enlace}" style="background:#8B4513;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Activar mi cuenta</a>
            <p>Si no te registraste en AppCenar, ignora este mensaje.</p>`
        )

        req.flash('exito', '¡Cuenta creada exitosamente! Revisa tu correo para activarla.')
        res.redirect('/')

    } catch (error) {
        console.error(error)
        res.render('auth/registro', {
            titulo: 'Crear cuenta',
            error: ['Ocurrió un error al crear la cuenta. Intenta de nuevo.'],
            datos: req.body
        })
    }
}

// GET /registro-comercio
const mostrarRegistroComercio = async (req, res) => {
    const tipos = await TipoComercio.find().lean()
    res.render('auth/registroComercio', { titulo: 'Registrar comercio', tipos })
}

// POST /registro-comercio

const procesarRegistroComercio = async (req, res) => {
    const errores = validationResult(req)
    if (!errores.isEmpty()) {
        const tipos = await TipoComercio.find().lean()
        return res.render('auth/registroComercio', {
            titulo: 'Registrar comercio',
            tipos,
            error: errores.array().map(e => e.msg),
            datos: req.body
        })
    }

    const { nombreComercio, telefono, correo, horaApertura, horaCierre, tipoComercio, contrasena } = req.body

    try {
        const usuarioExistente = await Usuario.findOne({ correo: correo.toLowerCase() })
        if (usuarioExistente) {
            const tipos = await TipoComercio.find().lean()
            return res.render('auth/registroComercio', {
                titulo: 'Registrar comercio',
                tipos,
                error: ['El correo ya está en uso.'],
                datos: req.body
            })
        }

        const token = uuidv4()
        const logo = req.file ? req.file.filename : null

        const nuevoUsuario = await Usuario.create({
            nombre: nombreComercio,
            correo,
            telefono,
            nombreUsuario: correo.split('@')[0] + Date.now(),
            contrasena,
            rol: 'comercio',
            activo: false,
            tokenActivacion: token
        })

        await Comercio.create({
            usuario: nuevoUsuario._id,
            nombreComercio,
            logo,
            horaApertura,
            horaCierre,
            tipoComercio
        })

        const enlace = `${process.env.URL_APP}/activar/${token}`
        await enviarCorreo(
            correo,
            '¡Activa tu comercio en AppCenar! 🍽️',
            `<h2>¡Hola, ${nombreComercio}!</h2>
            <p>Tu comercio fue registrado. Solo falta activarlo.</p>
            <a href="${enlace}" style="background:#8B4513;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Activar mi comercio</a>`
        )

        req.flash('exito', '¡Comercio registrado! Revisa tu correo para activarlo.')
        res.redirect('/')

    } catch (error) {
        console.error(error)
        const tipos = await TipoComercio.find().lean()
        res.render('auth/registroComercio', {
            titulo: 'Registrar comercio',
            tipos,
            error: ['Ocurrió un error al registrar el comercio. Intenta de nuevo.'],
            datos: req.body
        })
    }
}
// GET /activar/:token
const activarCuenta = async (req, res) => {
    try {
        const usuario = await Usuario.findOne({
            tokenActivacion: req.params.token,
            tokenActivacionUsado: false
        })

        if (!usuario) {
            req.flash('error', 'El enlace de activación no es válido o ya fue utilizado.')
            return res.redirect('/')
        }

        usuario.activo = true
        usuario.tokenActivacionUsado = true
        await usuario.save()

        req.flash('exito', '¡Tu cuenta fue activada exitosamente! Ya puedes iniciar sesión.')
        res.redirect('/')

    } catch (error) {
        console.error(error)
        req.flash('error', 'Ocurrió un error al activar la cuenta.')
        res.redirect('/')
    }
}

// GET /olvide-clave
const mostrarOlvideClave = (req, res) => {
    res.render('auth/olvideClave', { titulo: 'Restablecer contraseña' })
}

// POST /olvide-clave
const procesarOlvideClave = async (req, res) => {
    const { identificador } = req.body

    if (!identificador) {
        return res.render('auth/olvideClave', {
            titulo: 'Restablecer contraseña',
            error: ['Por favor ingresa tu correo o nombre de usuario.']
        })
    }

    try {
        const usuario = await Usuario.findOne({
            $or: [
                { correo: identificador.toLowerCase() },
                { nombreUsuario: identificador }
            ]
        })

        if (!usuario) {
            return res.render('auth/olvideClave', {
                titulo: 'Restablecer contraseña',
                error: ['No encontramos ninguna cuenta con ese correo o usuario.']
            })
        }

        const token = uuidv4()
        usuario.tokenRecuperacion = token
        usuario.tokenRecuperacionUsado = false
        await usuario.save()

        const enlace = `${process.env.URL_APP}/nueva-clave/${token}`
        await enviarCorreo(
            usuario.correo,
            'Restablecer contraseña en AppCenar 🔐',
            `<h2>¡Hola, ${usuario.nombre}!</h2>
            <p>Recibimos una solicitud para cambiar tu contraseña.</p>
            <a href="${enlace}" style="background:#8B4513;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Cambiar contraseña</a>
            <p>Si no fuiste tú, ignora este mensaje.</p>`
        )

        res.render('auth/olvideClave', {
            titulo: 'Restablecer contraseña',
            exito: ['¡Listo! Te enviamos un enlace a tu correo para cambiar la contraseña.']
        })

    } catch (error) {
        console.error(error)
        res.render('auth/olvideClave', {
            titulo: 'Restablecer contraseña',
            error: ['Ocurrió un error. Intenta de nuevo.']
        })
    }
}

// GET /nueva-clave/:token
const mostrarNuevaClave = async (req, res) => {
    const usuario = await Usuario.findOne({
        tokenRecuperacion: req.params.token,
        tokenRecuperacionUsado: false
    })

    if (!usuario) {
        req.flash('error', 'El enlace ya no es válido o ya fue utilizado.')
        return res.redirect('/')
    }

    res.render('auth/nuevaClave', { titulo: 'Nueva contraseña', token: req.params.token })
}

// POST /nueva-clave/:token
const procesarNuevaClave = async (req, res) => {
    const { contrasena, confirmarContrasena } = req.body

    if (!contrasena || !confirmarContrasena) {
        return res.render('auth/nuevaClave', {
            titulo: 'Nueva contraseña',
            token: req.params.token,
            error: ['Todos los campos son requeridos.']
        })
    }

    if (contrasena !== confirmarContrasena) {
        return res.render('auth/nuevaClave', {
            titulo: 'Nueva contraseña',
            token: req.params.token,
            error: ['Las contraseñas no coinciden.']
        })
    }

    try {
        const usuario = await Usuario.findOne({
            tokenRecuperacion: req.params.token,
            tokenRecuperacionUsado: false
        })

        if (!usuario) {
            req.flash('error', 'El enlace ya no es válido.')
            return res.redirect('/')
        }

        usuario.contrasena = contrasena
        usuario.tokenRecuperacionUsado = true
        usuario.tokenRecuperacion = null
        await usuario.save()

        req.flash('exito', '¡Contraseña actualizada! Ya puedes iniciar sesión.')
        res.redirect('/')

    } catch (error) {
        console.error(error)
        res.render('auth/nuevaClave', {
            titulo: 'Nueva contraseña',
            token: req.params.token,
            error: ['Ocurrió un error. Intenta de nuevo.']
        })
    }
}

// GET /cerrar-sesion
const cerrarSesion = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/')
    })
}

module.exports = {
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
}