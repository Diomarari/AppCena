const Usuario = require('../modelos/Usuario')
const Comercio = require('../modelos/Comercio')
const TipoComercio = require('../modelos/TipoComercio')
const Pedido = require('../modelos/Pedido')
const Producto = require('../modelos/Producto')
const Configuracion = require('../modelos/Configuracion')
const { validationResult } = require('express-validator')

// ==================== DASHBOARD ====================

const mostrarDashboard = async (req, res) => {
    try {
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)

        const totalPedidos = await Pedido.countDocuments()
        const pedidosHoy = await Pedido.countDocuments({ fechaPedido: { $gte: hoy } })

        const comerciosActivos = await Usuario.countDocuments({ rol: 'comercio', activo: true })
        const comerciosInactivos = await Usuario.countDocuments({ rol: 'comercio', activo: false })

        const clientesActivos = await Usuario.countDocuments({ rol: 'cliente', activo: true })
        const clientesInactivos = await Usuario.countDocuments({ rol: 'cliente', activo: false })

        const deliveriesActivos = await Usuario.countDocuments({ rol: 'delivery', activo: true })
        const deliveriesInactivos = await Usuario.countDocuments({ rol: 'delivery', activo: false })

        const totalProductos = await Producto.countDocuments()

        res.render('admin/home', {
            titulo: 'Dashboard',
            totalPedidos,
            pedidosHoy,
            comerciosActivos,
            comerciosInactivos,
            clientesActivos,
            clientesInactivos,
            deliveriesActivos,
            deliveriesInactivos,
            totalProductos
        })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Ocurrió un error al cargar el dashboard.')
        res.redirect('/admin/home')
    }
}

// ==================== CLIENTES ====================

const listarClientes = async (req, res) => {
    try {
const clientes = await Usuario.find({ rol: 'cliente' }).sort({ createdAt: -1 }).lean()

        const clientesConPedidos = await Promise.all(clientes.map(async (c) => {
            const cantidadPedidos = await Pedido.countDocuments({ cliente: c._id })
            return {
                _id: c._id,
                nombre: c.nombre,
                apellido: c.apellido,
                correo: c.correo,
                telefono: c.telefono,
                activo: c.activo,
                cantidadPedidos
            }
        }))

        res.render('admin/clientes', { titulo: 'Listado de Clientes', clientes: clientesConPedidos })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar los clientes.')
        res.redirect('/admin/home')
    }
}

// ==================== DELIVERIES ====================

const listarDeliveries = async (req, res) => {
    try {
const deliveries = await Usuario.find({ rol: 'delivery' }).sort({ createdAt: -1 }).lean()

        const deliveriesConPedidos = await Promise.all(deliveries.map(async (d) => {
            const cantidadPedidos = await Pedido.countDocuments({ delivery: d._id, estado: 'completado' })
            return {
                _id: d._id,
                nombre: d.nombre,
                apellido: d.apellido,
                correo: d.correo,
                telefono: d.telefono,
                activo: d.activo,
                cantidadPedidos
            }
        }))

        res.render('admin/deliveries', { titulo: 'Listado de Deliveries', deliveries: deliveriesConPedidos })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar los deliveries.')
        res.redirect('/admin/home')
    }
}

// ==================== COMERCIOS ====================

const listarComercios = async (req, res) => {
    try {
const usuariosComercios = await Usuario.find({ rol: 'comercio' }).sort({ createdAt: -1 }).lean()

        const comerciosData = await Promise.all(usuariosComercios.map(async (u) => {
            const comercio = await Comercio.findOne({ usuario: u._id }).populate('tipoComercio')
            const cantidadPedidos = comercio ? await Pedido.countDocuments({ comercio: comercio._id }) : 0
            return {
                _id: u._id,
                nombre: comercio ? comercio.nombreComercio : u.nombre,
                logo: comercio ? comercio.logo : null,
                correo: u.correo,
                telefono: u.telefono,
                horaApertura: comercio ? comercio.horaApertura : '',
                horaCierre: comercio ? comercio.horaCierre : '',
                activo: u.activo,
                cantidadPedidos
            }
        }))

        res.render('admin/comercios', { titulo: 'Listado de Comercios', comercios: comerciosData })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar los comercios.')
        res.redirect('/admin/home')
    }
}

// ==================== CAMBIAR ESTADO USUARIO ====================

const cambiarEstadoUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id)
        if (!usuario) {
            req.flash('error', 'Usuario no encontrado.')
            return res.redirect('back')
        }
        usuario.activo = !usuario.activo
        await usuario.save()
        req.flash('exito', `Usuario ${usuario.activo ? 'activado' : 'inactivado'} correctamente.`)
        res.redirect('back')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cambiar el estado del usuario.')
        res.redirect('back')
    }
}

// ==================== CONFIGURACION ====================

const mostrarConfiguracion = async (req, res) => {
    try {
const config = await Configuracion.findOne({ clave: 'ITBIS' }).lean()
        res.render('admin/configuracion', { titulo: 'Configuración', config })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar la configuración.')
        res.redirect('/admin/home')
    }
}

const mostrarEditarConfiguracion = async (req, res) => {
    try {
const config = await Configuracion.findOne({ clave: 'ITBIS' }).lean()
        res.render('admin/configuracionEditar', { titulo: 'Editar Configuración', config })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar la configuración.')
        res.redirect('/admin/configuracion')
    }
}

const procesarEditarConfiguracion = async (req, res) => {
    const { valor } = req.body
    if (!valor) {
        const config = await Configuracion.findOne({ clave: 'ITBIS' })
        return res.render('admin/configuracionEditar', {
            titulo: 'Editar Configuración',
            config,
            error: ['El valor del ITBIS es requerido.']
        })
    }
    try {
        await Configuracion.findOneAndUpdate({ clave: 'ITBIS' }, { valor })
        req.flash('exito', 'Configuración actualizada correctamente.')
        res.redirect('/admin/configuracion')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al actualizar la configuración.')
        res.redirect('/admin/configuracion')
    }
}

// ==================== ADMINISTRADORES ====================

const listarAdministradores = async (req, res) => {
    try {
const admins = await Usuario.find({ rol: 'admin' }).sort({ createdAt: -1 }).lean()
        res.render('admin/administradores', { titulo: 'Administradores', admins })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar los administradores.')
        res.redirect('/admin/home')
    }
}

const mostrarCrearAdmin = (req, res) => {
    res.render('admin/administradoresCrear', { titulo: 'Crear Administrador' })
}

const procesarCrearAdmin = async (req, res) => {
    const errores = validationResult(req)
    if (!errores.isEmpty()) {
        return res.render('admin/administradoresCrear', {
            titulo: 'Crear Administrador',
            error: errores.array().map(e => e.msg),
            datos: req.body
        })
    }

    const { nombre, apellido, cedula, correo, nombreUsuario, contrasena } = req.body

    try {
        const existe = await Usuario.findOne({
            $or: [{ correo: correo.toLowerCase() }, { nombreUsuario }]
        })
        if (existe) {
            return res.render('admin/administradoresCrear', {
                titulo: 'Crear Administrador',
                error: ['El correo o nombre de usuario ya está en uso.'],
                datos: req.body
            })
        }

        await Usuario.create({
            nombre, apellido, cedula, correo,
            nombreUsuario, contrasena,
            rol: 'admin', activo: true
        })

        req.flash('exito', 'Administrador creado correctamente.')
        res.redirect('/admin/administradores')
    } catch (error) {
        console.error(error)
        res.render('admin/administradoresCrear', {
            titulo: 'Crear Administrador',
            error: ['Error al crear el administrador.'],
            datos: req.body
        })
    }
}

const mostrarEditarAdmin = async (req, res) => {
    try {
        const admin = await Usuario.findById(req.params.id)
        if (!admin || admin.esAdminPorDefecto) {
            req.flash('error', 'No se puede editar este administrador.')
            return res.redirect('/admin/administradores')
        }
        if (req.session.usuario.id.toString() === admin._id.toString()) {
            req.flash('error', 'No puedes editarte a ti mismo.')
            return res.redirect('/admin/administradores')
        }
        res.render('admin/administradoresEditar', { titulo: 'Editar Administrador', admin })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar el administrador.')
        res.redirect('/admin/administradores')
    }
}

const procesarEditarAdmin = async (req, res) => {
    const errores = validationResult(req)
    if (!errores.isEmpty()) {
        const admin = await Usuario.findById(req.params.id)
        return res.render('admin/administradoresEditar', {
            titulo: 'Editar Administrador',
            admin,
            error: errores.array().map(e => e.msg)
        })
    }

    const { nombre, apellido, cedula, correo, nombreUsuario, contrasena } = req.body

    try {
        const admin = await Usuario.findById(req.params.id)
        if (admin.esAdminPorDefecto) {
            req.flash('error', 'No se puede editar el administrador por defecto.')
            return res.redirect('/admin/administradores')
        }

        admin.nombre = nombre
        admin.apellido = apellido
        admin.cedula = cedula
        admin.correo = correo
        admin.nombreUsuario = nombreUsuario
        if (contrasena) admin.contrasena = contrasena
        await admin.save()

        req.flash('exito', 'Administrador actualizado correctamente.')
        res.redirect('/admin/administradores')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al actualizar el administrador.')
        res.redirect('/admin/administradores')
    }
}

const cambiarEstadoAdmin = async (req, res) => {
    try {
        const admin = await Usuario.findById(req.params.id)
        if (!admin) {
            req.flash('error', 'Administrador no encontrado.')
            return res.redirect('/admin/administradores')
        }
        if (admin.esAdminPorDefecto) {
            req.flash('error', 'No se puede inactivar el administrador por defecto.')
            return res.redirect('/admin/administradores')
        }
        if (req.session.usuario.id.toString() === admin._id.toString()) {
            req.flash('error', 'No puedes cambiar tu propio estado.')
            return res.redirect('/admin/administradores')
        }
        admin.activo = !admin.activo
        await admin.save()
        req.flash('exito', `Administrador ${admin.activo ? 'activado' : 'inactivado'} correctamente.`)
        res.redirect('/admin/administradores')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cambiar el estado.')
        res.redirect('/admin/administradores')
    }
}

// ==================== TIPOS DE COMERCIO ====================

const listarTiposComercios = async (req, res) => {
    try {
const tipos = await TipoComercio.find().sort({ createdAt: -1 }).lean()
const tiposConCantidad = await Promise.all(tipos.map(async (t) => {
    const cantidad = await Comercio.countDocuments({ tipoComercio: t._id })
    return { ...t, cantidad }   // ← sin .toObject()
}))
        res.render('admin/tiposComercios', { titulo: 'Tipos de Comercio', tipos: tiposConCantidad })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar los tipos de comercio.')
        res.redirect('/admin/home')
    }
}

const mostrarCrearTipo = (req, res) => {
    res.render('admin/tiposComerciosCrear', { titulo: 'Crear Tipo de Comercio' })
}

const procesarCrearTipo = async (req, res) => {
    const { nombre, descripcion } = req.body
    const errores = []

    if (!nombre) errores.push('El nombre es requerido.')
    if (!descripcion) errores.push('La descripción es requerida.')
    if (!req.file) errores.push('El icono es requerido.')

    if (errores.length > 0) {
        return res.render('admin/tiposComerciosCrear', {
            titulo: 'Crear Tipo de Comercio',
            error: errores,
            datos: req.body
        })
    }

    try {
        await TipoComercio.create({ nombre, descripcion, icono: req.file.filename })
        req.flash('exito', 'Tipo de comercio creado correctamente.')
        res.redirect('/admin/tipos-comercio')
    } catch (error) {
        console.error(error)
        res.render('admin/tiposComerciosCrear', {
            titulo: 'Crear Tipo de Comercio',
            error: ['Error al crear el tipo de comercio.'],
            datos: req.body
        })
    }
}

const mostrarEditarTipo = async (req, res) => {
    try {
const tipo = await TipoComercio.findById(req.params.id).lean()
        if (!tipo) {
            req.flash('error', 'Tipo de comercio no encontrado.')
            return res.redirect('/admin/tipos-comercio')
        }
        res.render('admin/tiposComerciosEditar', { titulo: 'Editar Tipo de Comercio', tipo })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar el tipo de comercio.')
        res.redirect('/admin/tipos-comercio')
    }
}

const procesarEditarTipo = async (req, res) => {
    const { nombre, descripcion } = req.body
    if (!nombre || !descripcion) {
        const tipo = await TipoComercio.findById(req.params.id)
        return res.render('admin/tiposComerciosEditar', {
            titulo: 'Editar Tipo de Comercio',
            tipo,
            error: ['El nombre y la descripción son requeridos.']
        })
    }
    try {
        const tipo = await TipoComercio.findById(req.params.id)
        tipo.nombre = nombre
        tipo.descripcion = descripcion
        if (req.file) tipo.icono = req.file.filename
        await tipo.save()
        req.flash('exito', 'Tipo de comercio actualizado correctamente.')
        res.redirect('/admin/tipos-comercio')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al actualizar.')
        res.redirect('/admin/tipos-comercio')
    }
}

const mostrarEliminarTipo = async (req, res) => {
    try {
        const tipo = await TipoComercio.findById(req.params.id)
        if (!tipo) {
            req.flash('error', 'Tipo de comercio no encontrado.')
            return res.redirect('/admin/tipos-comercio')
        }
        res.render('admin/tiposComerciosEliminar', { titulo: 'Eliminar Tipo de Comercio', tipo })
    } catch (error) {
        console.error(error)
        res.redirect('/admin/tipos-comercio')
    }
}

const procesarEliminarTipo = async (req, res) => {
    try {
        const tipo = await TipoComercio.findById(req.params.id)
        if (!tipo) {
            req.flash('error', 'Tipo de comercio no encontrado.')
            return res.redirect('/admin/tipos-comercio')
        }
        // Hard delete en cascada
        const comercios = await Comercio.find({ tipoComercio: tipo._id })
        for (const comercio of comercios) {
            await Usuario.findByIdAndDelete(comercio.usuario)
            await Comercio.findByIdAndDelete(comercio._id)
        }
        await TipoComercio.findByIdAndDelete(tipo._id)
        req.flash('exito', 'Tipo de comercio y sus comercios asociados eliminados correctamente.')
        res.redirect('/admin/tipos-comercio')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al eliminar.')
        res.redirect('/admin/tipos-comercio')
    }
}

module.exports = {
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
}