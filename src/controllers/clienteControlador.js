const Usuario = require('../modelos/Usuario')
const Comercio = require('../modelos/Comercio')
const TipoComercio = require('../modelos/TipoComercio')
const Producto = require('../modelos/Producto')
const Categoria = require('../modelos/Categoria')
const Pedido = require('../modelos/Pedido')
const DetallePedido = require('../modelos/DetallePedido')
const Direccion = require('../modelos/Direccion')
const Favorito = require('../modelos/Favorito')
const Configuracion = require('../modelos/Configuracion')

const mostrarHome = async (req, res) => {
    try {
        const tipos = await TipoComercio.find().sort({ nombre: 1 }).lean()
        res.render('cliente/home', { titulo: 'Inicio', tipos })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar el inicio.')
        res.redirect('/')
    }
}

const mostrarComercios = async (req, res) => {
    try {
        const tipo = await TipoComercio.findById(req.params.tipoId).lean()
        if (!tipo) {
            req.flash('error', 'Tipo de comercio no encontrado.')
            return res.redirect('/cliente/home')
        }

        const busqueda = req.query.buscar || ''

        const comerciosDB = await Comercio.find({ tipoComercio: tipo._id })
            .populate('usuario')
            .lean()

        const comerciosFiltrados = comerciosDB.filter(c => {
            const estaActivo = c.usuario && c.usuario.activo
            const coincide = busqueda === '' ||
                c.nombreComercio.toLowerCase().includes(busqueda.toLowerCase())
            return estaActivo && coincide
        })

        const favoritosCliente = await Favorito.find({
            cliente: req.session.usuario.id
        }).lean()
        const idsFavoritos = favoritosCliente.map(f => f.comercio.toString())

        const comercios = comerciosFiltrados.map(c => ({
            _id: c._id,
            nombreComercio: c.nombreComercio,
            logo: c.logo,
            esFavorito: idsFavoritos.includes(c._id.toString())
        }))

        res.render('cliente/comercios', {
            titulo: `Comercios - ${tipo.nombre}`,
            tipo,
            comercios,
            cantidad: comercios.length,
            busqueda
        })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar los comercios.')
        res.redirect('/cliente/home')
    }
}

const mostrarCatalogo = async (req, res) => {
    try {
        const comercio = await Comercio.findById(req.params.comercioId)
            .populate('usuario')
            .populate('tipoComercio')
            .lean()

        if (!comercio || !comercio.usuario.activo) {
            req.flash('error', 'Comercio no disponible.')
            return res.redirect('/cliente/home')
        }

        const categorias = await Categoria.find({ comercio: comercio._id }).lean()

        const catalogoConProductos = await Promise.all(categorias.map(async (cat) => {
            const productos = await Producto.find({ categoria: cat._id, activo: true }).lean()
            return { ...cat, productos }
        }))

        const catalogoFiltrado = catalogoConProductos.filter(c => c.productos.length > 0)

        res.render('cliente/catalogo', {
            titulo: comercio.nombreComercio,
            comercio,
            catalogo: catalogoFiltrado
        })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar el catálogo.')
        res.redirect('/cliente/home')
    }
}

const mostrarConfirmarPedido = async (req, res) => {
    try {
        const { comercioId, productos } = req.query

        if (!productos) {
            req.flash('error', 'No has seleccionado ningún producto.')
            return res.redirect(`/cliente/catalogo/${comercioId}`)
        }

        let productosSeleccionados
        try {
            productosSeleccionados = JSON.parse(decodeURIComponent(productos))
        } catch {
            req.flash('error', 'Error al leer los productos.')
            return res.redirect(`/cliente/catalogo/${comercioId}`)
        }

        if (!productosSeleccionados || productosSeleccionados.length === 0) {
            req.flash('error', 'No has seleccionado ningún producto.')
            return res.redirect(`/cliente/catalogo/${comercioId}`)
        }

        const comercio = await Comercio.findById(comercioId).lean()
        const config = await Configuracion.findOne({ clave: 'ITBIS' }).lean()
        const porcentajeItbis = parseFloat(config ? config.valor : 18)

        const productosDetalle = await Promise.all(productosSeleccionados.map(async (p) => {
            const prod = await Producto.findById(p.id).lean()
            return prod ? { _id: prod._id, nombre: prod.nombre, precio: prod.precio, foto: prod.foto } : null
        }))

        const productosValidos = productosDetalle.filter(p => p !== null)
        const subtotal = productosValidos.reduce((acc, p) => acc + p.precio, 0)
        const montoItbis = parseFloat((subtotal * porcentajeItbis / 100).toFixed(2))
        const total = parseFloat((subtotal + montoItbis).toFixed(2))

        const direcciones = await Direccion.find({ cliente: req.session.usuario.id }).lean()

        res.render('cliente/confirmarPedido', {
            titulo: 'Confirmar pedido',
            comercio,
            productos: productosValidos,
            subtotal,
            porcentajeItbis,
            montoItbis,
            total,
            direcciones,
            productosJSON: encodeURIComponent(JSON.stringify(productosSeleccionados))
        })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al procesar el pedido.')
        res.redirect('/cliente/home')
    }
}

const procesarCrearPedido = async (req, res) => {
    const { comercioId, direccionId, productosJSON } = req.body

    try {
        let productos
        try {
            productos = JSON.parse(decodeURIComponent(productosJSON))
        } catch {
            req.flash('error', 'Error al leer los productos.')
            return res.redirect('/cliente/home')
        }

        if (!productos || productos.length === 0) {
            req.flash('error', 'El pedido debe contener al menos un producto.')
            return res.redirect('/cliente/home')
        }

        const direccion = await Direccion.findById(direccionId)
        if (!direccion || direccion.cliente.toString() !== req.session.usuario.id.toString()) {
            req.flash('error', 'La dirección seleccionada no es válida.')
            return res.redirect('/cliente/home')
        }

        const config = await Configuracion.findOne({ clave: 'ITBIS' }).lean()
        const porcentajeItbis = parseFloat(config ? config.valor : 18)

        const productosDetalle = await Promise.all(productos.map(async (p) => {
            return await Producto.findById(p.id).lean()
        }))

        const productosValidos = productosDetalle.filter(p => p !== null)
        const subtotal = productosValidos.reduce((acc, p) => acc + p.precio, 0)
        const montoItbis = parseFloat((subtotal * porcentajeItbis / 100).toFixed(2))
        const total = parseFloat((subtotal + montoItbis).toFixed(2))

        const nuevoPedido = await Pedido.create({
            cliente: req.session.usuario.id,
            comercio: comercioId,
            direccion: direccionId,
            subtotal,
            itbis: montoItbis,
            total,
            estado: 'pendiente'
        })

        await Promise.all(productosValidos.map(async (prod) => {
            await DetallePedido.create({
                pedido: nuevoPedido._id,
                producto: prod._id,
                nombreProducto: prod.nombre,
                precio: prod.precio,
                foto: prod.foto
            })
        }))

        req.flash('exito', '¡Pedido realizado exitosamente!')
        res.redirect('/cliente/home')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al crear el pedido.')
        res.redirect('/cliente/home')
    }
}

const mostrarPedidos = async (req, res) => {
    try {
        const pedidos = await Pedido.find({ cliente: req.session.usuario.id })
            .populate('comercio')
            .sort({ fechaPedido: -1 })
            .lean()

        const pedidosConDetalle = await Promise.all(pedidos.map(async (p) => {
            const detalles = await DetallePedido.find({ pedido: p._id }).lean()
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

        res.render('cliente/pedidos', { titulo: 'Mis Pedidos', pedidos: pedidosConDetalle })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar los pedidos.')
        res.redirect('/cliente/home')
    }
}

const mostrarDetallePedido = async (req, res) => {
    try {
        const pedido = await Pedido.findOne({
            _id: req.params.id,
            cliente: req.session.usuario.id
        }).populate('comercio').lean()

        if (!pedido) {
            req.flash('error', 'Pedido no encontrado.')
            return res.redirect('/cliente/pedidos')
        }

        const detalles = await DetallePedido.find({ pedido: pedido._id }).lean()

        res.render('cliente/pedidoDetalle', {
            titulo: 'Detalle del Pedido',
            pedido,
            detalles
        })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar el pedido.')
        res.redirect('/cliente/pedidos')
    }
}

const mostrarPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.session.usuario.id).lean()
        res.render('cliente/perfil', { titulo: 'Mi Perfil', usuarioDatos: usuario })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar el perfil.')
        res.redirect('/cliente/home')
    }
}

const procesarEditarPerfil = async (req, res) => {
    const { nombre, apellido, telefono } = req.body
    const errores = []

    if (!nombre) errores.push('El nombre es requerido.')
    if (!apellido) errores.push('El apellido es requerido.')
    if (!telefono) errores.push('El teléfono es requerido.')

    if (errores.length > 0) {
        const usuario = await Usuario.findById(req.session.usuario.id).lean()
        return res.render('cliente/perfil', {
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
        res.redirect('/cliente/perfil')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al actualizar el perfil.')
        res.redirect('/cliente/perfil')
    }
}

const mostrarDirecciones = async (req, res) => {
    try {
        const direcciones = await Direccion.find({ cliente: req.session.usuario.id }).lean()
        res.render('cliente/direcciones', { titulo: 'Mis Direcciones', direcciones })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar las direcciones.')
        res.redirect('/cliente/home')
    }
}

const mostrarCrearDireccion = (req, res) => {
    res.render('cliente/direccionesCrear', { titulo: 'Nueva Dirección' })
}

const procesarCrearDireccion = async (req, res) => {
    const { nombre, descripcion } = req.body
    if (!nombre || !descripcion) {
        return res.render('cliente/direccionesCrear', {
            titulo: 'Nueva Dirección',
            error: ['Todos los campos son requeridos.'],
            datos: req.body
        })
    }
    try {
        await Direccion.create({ nombre, descripcion, cliente: req.session.usuario.id })
        req.flash('exito', 'Dirección creada correctamente.')
        res.redirect('/cliente/direcciones')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al crear la dirección.')
        res.redirect('/cliente/direcciones')
    }
}

const mostrarEditarDireccion = async (req, res) => {
    try {
        const direccion = await Direccion.findOne({
            _id: req.params.id,
            cliente: req.session.usuario.id
        }).lean()
        if (!direccion) {
            req.flash('error', 'Dirección no encontrada.')
            return res.redirect('/cliente/direcciones')
        }
        res.render('cliente/direccionesEditar', { titulo: 'Editar Dirección', direccion })
    } catch (error) {
        console.error(error)
        res.redirect('/cliente/direcciones')
    }
}

const procesarEditarDireccion = async (req, res) => {
    const { nombre, descripcion } = req.body
    if (!nombre || !descripcion) {
        const direccion = await Direccion.findById(req.params.id).lean()
        return res.render('cliente/direccionesEditar', {
            titulo: 'Editar Dirección',
            direccion,
            error: ['Todos los campos son requeridos.']
        })
    }
    try {
        await Direccion.findOneAndUpdate(
            { _id: req.params.id, cliente: req.session.usuario.id },
            { nombre, descripcion }
        )
        req.flash('exito', 'Dirección actualizada correctamente.')
        res.redirect('/cliente/direcciones')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al actualizar la dirección.')
        res.redirect('/cliente/direcciones')
    }
}

const mostrarEliminarDireccion = async (req, res) => {
    try {
        const direccion = await Direccion.findOne({
            _id: req.params.id,
            cliente: req.session.usuario.id
        }).lean()
        if (!direccion) {
            req.flash('error', 'Dirección no encontrada.')
            return res.redirect('/cliente/direcciones')
        }
        res.render('cliente/direccionesEliminar', { titulo: 'Eliminar Dirección', direccion })
    } catch (error) {
        console.error(error)
        res.redirect('/cliente/direcciones')
    }
}

const procesarEliminarDireccion = async (req, res) => {
    try {
        await Direccion.findOneAndDelete({
            _id: req.params.id,
            cliente: req.session.usuario.id
        })
        req.flash('exito', 'Dirección eliminada correctamente.')
        res.redirect('/cliente/direcciones')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al eliminar la dirección.')
        res.redirect('/cliente/direcciones')
    }
}

const mostrarFavoritos = async (req, res) => {
    try {
        const favoritos = await Favorito.find({ cliente: req.session.usuario.id })
            .populate('comercio')
            .lean()
        res.render('cliente/favoritos', { titulo: 'Mis Favoritos', favoritos })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar los favoritos.')
        res.redirect('/cliente/home')
    }
}

const toggleFavorito = async (req, res) => {
    try {
        const { comercioId } = req.params
        const clienteId = req.session.usuario.id

        const existe = await Favorito.findOne({ cliente: clienteId, comercio: comercioId })
        if (existe) {
            await Favorito.findByIdAndDelete(existe._id)
        } else {
            await Favorito.create({ cliente: clienteId, comercio: comercioId })
        }

        res.redirect('back')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al actualizar favoritos.')
        res.redirect('back')
    }
}

const removerFavorito = async (req, res) => {
    try {
        await Favorito.findOneAndDelete({
            cliente: req.session.usuario.id,
            comercio: req.params.comercioId
        })
        req.flash('exito', 'Comercio removido de favoritos.')
        res.redirect('/cliente/favoritos')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al remover el favorito.')
        res.redirect('/cliente/favoritos')
    }
}

module.exports = {
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
}