const Usuario = require('../modelos/Usuario')
const Comercio = require('../modelos/Comercio')
const Pedido = require('../modelos/Pedido')
const DetallePedido = require('../modelos/DetallePedido')

const mostrarHome = async (req, res) => {
    try {
        const pedidos = await Pedido.find({ delivery: req.session.usuario.id })
            .populate('comercio')
            .sort({ fechaPedido: -1 })

        const pedidosConDetalle = await Promise.all(pedidos.map(async (p) => {
            const detalles = await DetallePedido.find({ pedido: p._id })
            return {
                _id: p._id,
                estado: p.estado,
                total: p.total,
                fechaPedido: p.fechaPedido,
                cantidadProductos: detalles.length,
                comercioNombre: p.comercio ? p.comercio.nombreComercio : 'Comercio',
                comercioLogo: p.comercio ? p.comercio.logo : null
            }
        }))

        res.render('delivery/home', {
            titulo: 'Mis Pedidos Asignados',
            pedidos: pedidosConDetalle
        })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar el home.')
        res.redirect('/')
    }
}

const mostrarDetallePedido = async (req, res) => {
    try {
        const pedido = await Pedido.findOne({
            _id: req.params.id,
            delivery: req.session.usuario.id
        }).populate('comercio').populate('direccion')

        if (!pedido) {
            req.flash('error', 'Pedido no encontrado.')
            return res.redirect('/delivery/home')
        }

        const detalles = await DetallePedido.find({ pedido: pedido._id })
        const mostrarDireccion = pedido.estado === 'en proceso'

        res.render('delivery/pedidoDetalle', {
            titulo: 'Detalle del Pedido',
            pedido,
            detalles,
            mostrarDireccion,
            puedeCompletar: pedido.estado === 'en proceso'
        })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar el pedido.')
        res.redirect('/delivery/home')
    }
}

const completarPedido = async (req, res) => {
    try {
        const pedido = await Pedido.findOne({
            _id: req.params.id,
            delivery: req.session.usuario.id,
            estado: 'en proceso'
        })

        if (!pedido) {
            req.flash('error', 'No puedes completar este pedido.')
            return res.redirect('/delivery/home')
        }

        pedido.estado = 'completado'
        await pedido.save()

        const delivery = await Usuario.findById(req.session.usuario.id)
        delivery.disponible = true
        await delivery.save()

        req.flash('exito', '¡Pedido completado exitosamente!')
        res.redirect('/delivery/home')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al completar el pedido.')
        res.redirect('/delivery/home')
    }
}

const mostrarPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.session.usuario.id)
        res.render('delivery/perfil', { titulo: 'Mi Perfil', usuarioDatos: usuario })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar el perfil.')
        res.redirect('/delivery/home')
    }
}

const procesarEditarPerfil = async (req, res) => {
    const { nombre, apellido, telefono } = req.body
    const errores = []
    if (!nombre) errores.push('El nombre es requerido.')
    if (!apellido) errores.push('El apellido es requerido.')
    if (!telefono) errores.push('El teléfono es requerido.')

    if (errores.length > 0) {
        const usuario = await Usuario.findById(req.session.usuario.id)
        return res.render('delivery/perfil', {
            titulo: 'Mi Perfil',
            usuarioDatos: usuario,
            error: errores
        })
    }

    try {
        const usuario = await Usuario.findById(req.session.usuario.id)
        usuario.nombre = nombre
        usuario.apellido = apellido
        usuario.telefono = telefono
        if (req.file) usuario.foto = req.file.filename
        await usuario.save()

        req.session.usuario.nombre = nombre
        req.session.usuario.apellido = apellido

        req.flash('exito', 'Perfil actualizado correctamente.')
        res.redirect('/delivery/perfil')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al actualizar el perfil.')
        res.redirect('/delivery/perfil')
    }
}

module.exports = {
    mostrarHome,
    mostrarDetallePedido,
    completarPedido,
    mostrarPerfil,
    procesarEditarPerfil
}