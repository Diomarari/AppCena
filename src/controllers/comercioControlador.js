const Usuario = require('../modelos/Usuario')
const Comercio = require('../modelos/Comercio')
const Categoria = require('../modelos/Categoria')
const Producto = require('../modelos/Producto')
const Pedido = require('../modelos/Pedido')
const DetallePedido = require('../modelos/DetallePedido')
const Usuario2 = require('../modelos/Usuario')
const { validationResult } = require('express-validator')

// ==================== HOME ====================

const mostrarHome = async (req, res) => {
    try {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })
        if (!comercio) {
            req.flash('error', 'No se encontró el perfil del comercio.')
            return res.redirect('/cerrar-sesion')
        }

        const pedidos = await Pedido.find({ comercio: comercio._id })
            .sort({ fechaPedido: -1 })

        const pedidosConDetalle = await Promise.all(pedidos.map(async (p) => {
            const detalles = await DetallePedido.find({ pedido: p._id })
            return {
                _id: p._id,
                estado: p.estado,
                total: p.total,
                fechaPedido: p.fechaPedido,
                cantidadProductos: detalles.length,
                comercioNombre: comercio.nombreComercio,
                comercioLogo: comercio.logo
            }
        }))

        res.render('comercio/home', {
            titulo: 'Mis Pedidos',
            pedidos: pedidosConDetalle,
            comercio
        })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar el home.')
        res.redirect('/')
    }
}

// ==================== DETALLE PEDIDO ====================

const mostrarDetallePedido = async (req, res) => {
    try {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })

        const pedido = await Pedido.findOne({
            _id: req.params.id,
            comercio: comercio._id
        }).populate('cliente').populate('direccion')

        if (!pedido) {
            req.flash('error', 'Pedido no encontrado.')
            return res.redirect('/comercio/home')
        }

        const detalles = await DetallePedido.find({ pedido: pedido._id })

        res.render('comercio/pedidoDetalle', {
            titulo: 'Detalle del Pedido',
            pedido,
            detalles,
            comercio,
            puedeAsignar: pedido.estado === 'pendiente'
        })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar el pedido.')
        res.redirect('/comercio/home')
    }
}

// ==================== ASIGNAR DELIVERY ====================

const asignarDelivery = async (req, res) => {
    try {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })

        const pedido = await Pedido.findOne({
            _id: req.params.id,
            comercio: comercio._id,
            estado: 'pendiente'
        })

        if (!pedido) {
            req.flash('error', 'Este pedido no puede recibir un delivery.')
            return res.redirect('/comercio/home')
        }

        const deliveryDisponible = await Usuario.findOne({
            rol: 'delivery',
            activo: true,
            disponible: true
        })

        if (!deliveryDisponible) {
            req.flash('error', 'No hay delivery disponible en este momento. Intenta más tarde.')
            return res.redirect(`/comercio/pedidos/${req.params.id}`)
        }

        pedido.delivery = deliveryDisponible._id
        pedido.estado = 'en proceso'
        await pedido.save()

        deliveryDisponible.disponible = false
        await deliveryDisponible.save()

        req.flash('exito', `Delivery asignado correctamente.`)
        res.redirect('/comercio/home')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al asignar el delivery.')
        res.redirect('/comercio/home')
    }
}

// ==================== PERFIL ====================

const mostrarPerfil = async (req, res) => {
    try {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })
        const usuario = await Usuario.findById(req.session.usuario.id)
        res.render('comercio/perfil', {
            titulo: 'Perfil del Comercio',
            comercio,
            usuarioDatos: usuario
        })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar el perfil.')
        res.redirect('/comercio/home')
    }
}

const procesarEditarPerfil = async (req, res) => {
    const { horaApertura, horaCierre, telefono, correo } = req.body
    const errores = []

    if (!horaApertura) errores.push('La hora de apertura es requerida.')
    if (!horaCierre) errores.push('La hora de cierre es requerida.')
    if (!telefono) errores.push('El teléfono es requerido.')
    if (!correo) errores.push('El correo es requerido.')

    if (errores.length > 0) {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })
        const usuario = await Usuario.findById(req.session.usuario.id)
        return res.render('comercio/perfil', {
            titulo: 'Perfil del Comercio',
            comercio,
            usuarioDatos: usuario,
            error: errores
        })
    }

    try {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })
        comercio.horaApertura = horaApertura
        comercio.horaCierre = horaCierre
        if (req.file) comercio.logo = req.file.filename
        await comercio.save()

        const usuario = await Usuario.findById(req.session.usuario.id)
        usuario.telefono = telefono
        usuario.correo = correo
        await usuario.save()

        req.flash('exito', 'Perfil actualizado correctamente.')
        res.redirect('/comercio/perfil')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al actualizar el perfil.')
        res.redirect('/comercio/perfil')
    }
}

// ==================== CATEGORIAS ====================

const mostrarCategorias = async (req, res) => {
    try {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })
        const categorias = await Categoria.find({ comercio: comercio._id }).sort({ createdAt: -1 })

        const categoriasConCantidad = await Promise.all(categorias.map(async (cat) => {
            const cantidad = await Producto.countDocuments({ categoria: cat._id })
            return { ...cat.toObject(), cantidad }
        }))

        res.render('comercio/categorias', {
            titulo: 'Mantenimiento de Categorías',
            categorias: categoriasConCantidad
        })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar las categorías.')
        res.redirect('/comercio/home')
    }
}

const mostrarCrearCategoria = (req, res) => {
    res.render('comercio/categoriasCrear', { titulo: 'Nueva Categoría' })
}

const procesarCrearCategoria = async (req, res) => {
    const { nombre, descripcion } = req.body
    if (!nombre || !descripcion) {
        return res.render('comercio/categoriasCrear', {
            titulo: 'Nueva Categoría',
            error: ['Todos los campos son requeridos.'],
            datos: req.body
        })
    }
    try {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })
        await Categoria.create({ nombre, descripcion, comercio: comercio._id })
        req.flash('exito', 'Categoría creada correctamente.')
        res.redirect('/comercio/categorias')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al crear la categoría.')
        res.redirect('/comercio/categorias')
    }
}

const mostrarEditarCategoria = async (req, res) => {
    try {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })
        const categoria = await Categoria.findOne({ 
            _id: req.params.id, 
            comercio: comercio._id 
        }).lean()
        if (!categoria) {
            req.flash('error', 'Categoría no encontrada.')
            return res.redirect('/comercio/categorias')
        }
        res.render('comercio/categoriasEditar', { titulo: 'Editar Categoría', categoria })
    } catch (error) {
        console.error(error)
        res.redirect('/comercio/categorias')
    }
}

const procesarEditarCategoria = async (req, res) => {
    const { nombre, descripcion } = req.body
    if (!nombre || !descripcion) {
        const categoria = await Categoria.findById(req.params.id)
        return res.render('comercio/categoriasEditar', {
            titulo: 'Editar Categoría',
            categoria,
            error: ['Todos los campos son requeridos.']
        })
    }
    try {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })
        await Categoria.findOneAndUpdate(
            { _id: req.params.id, comercio: comercio._id },
            { nombre, descripcion }
        )
        req.flash('exito', 'Categoría actualizada correctamente.')
        res.redirect('/comercio/categorias')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al actualizar la categoría.')
        res.redirect('/comercio/categorias')
    }
}

const mostrarEliminarCategoria = async (req, res) => {
    try {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })
        const categoria = await Categoria.findOne({ _id: req.params.id, comercio: comercio._id })
        if (!categoria) {
            req.flash('error', 'Categoría no encontrada.')
            return res.redirect('/comercio/categorias')
        }
        res.render('comercio/categoriasEliminar', { titulo: 'Eliminar Categoría', categoria })
    } catch (error) {
        console.error(error)
        res.redirect('/comercio/categorias')
    }
}

const procesarEliminarCategoria = async (req, res) => {
    try {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })
        await Categoria.findOneAndDelete({ _id: req.params.id, comercio: comercio._id })
        req.flash('exito', 'Categoría eliminada correctamente.')
        res.redirect('/comercio/categorias')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al eliminar la categoría.')
        res.redirect('/comercio/categorias')
    }
}

// ==================== PRODUCTOS ====================

const mostrarProductos = async (req, res) => {
    try {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })
        const productos = await Producto.find({ comercio: comercio._id })
            .populate('categoria')
            .sort({ createdAt: -1 })
        res.render('comercio/productos', { titulo: 'Mantenimiento de Productos', productos })
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al cargar los productos.')
        res.redirect('/comercio/home')
    }
}

const mostrarCrearProducto = async (req, res) => {
    try {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })
        const categorias = await Categoria.find({ comercio: comercio._id })
        res.render('comercio/productosCrear', { titulo: 'Nuevo Producto', categorias })
    } catch (error) {
        console.error(error)
        res.redirect('/comercio/productos')
    }
}

const procesarCrearProducto = async (req, res) => {
    const { nombre, descripcion, precio, categoriaId } = req.body
    const errores = []
    if (!nombre) errores.push('El nombre es requerido.')
    if (!descripcion) errores.push('La descripción es requerida.')
    if (!precio) errores.push('El precio es requerido.')
    if (!categoriaId) errores.push('La categoría es requerida.')
    if (!req.file) errores.push('La foto del producto es requerida.')

    if (errores.length > 0) {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })
        const categorias = await Categoria.find({ comercio: comercio._id })
        return res.render('comercio/productosCrear', {
            titulo: 'Nuevo Producto',
            categorias,
            error: errores,
            datos: req.body
        })
    }

    try {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })
        await Producto.create({
            nombre,
            descripcion,
            precio: parseFloat(precio),
            foto: req.file.filename,
            categoria: categoriaId,
            comercio: comercio._id
        })
        req.flash('exito', 'Producto creado correctamente.')
        res.redirect('/comercio/productos')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al crear el producto.')
        res.redirect('/comercio/productos')
    }
}

const mostrarEditarProducto = async (req, res) => {
    try {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })
        const producto = await Producto.findOne({ _id: req.params.id, comercio: comercio._id }).lean()
        if (!producto) {
            req.flash('error', 'Producto no encontrado.')
            return res.redirect('/comercio/productos')
        }
        const categorias = await Categoria.find({ comercio: comercio._id }).lean()
        res.render('comercio/productosEditar', {
            titulo: 'Editar Producto',
            producto,
            categorias,
            categoriaSeleccionada: producto.categoria.toString()  // 👈 esto
        })
    } catch (error) {
        console.error(error)
        res.redirect('/comercio/productos')
    }
}

const procesarEditarProducto = async (req, res) => {
    const { nombre, descripcion, precio, categoriaId } = req.body
    const errores = []
    if (!nombre) errores.push('El nombre es requerido.')
    if (!descripcion) errores.push('La descripción es requerida.')
    if (!precio) errores.push('El precio es requerido.')
    if (!categoriaId) errores.push('La categoría es requerida.')

    if (errores.length > 0) {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })
        const producto = await Producto.findById(req.params.id)
        const categorias = await Categoria.find({ comercio: comercio._id })
        return res.render('comercio/productosEditar', {
            titulo: 'Editar Producto',
            producto,
            categorias,
            error: errores
        })
    }

    try {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })
        const producto = await Producto.findOne({ _id: req.params.id, comercio: comercio._id })
        producto.nombre = nombre
        producto.descripcion = descripcion
        producto.precio = parseFloat(precio)
        producto.categoria = categoriaId
        if (req.file) producto.foto = req.file.filename
        await producto.save()

        req.flash('exito', 'Producto actualizado correctamente.')
        res.redirect('/comercio/productos')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al actualizar el producto.')
        res.redirect('/comercio/productos')
    }
}

const mostrarEliminarProducto = async (req, res) => {
    try {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })
        const producto = await Producto.findOne({ _id: req.params.id, comercio: comercio._id })
            .populate('categoria')
        if (!producto) {
            req.flash('error', 'Producto no encontrado.')
            return res.redirect('/comercio/productos')
        }
        res.render('comercio/productosEliminar', { titulo: 'Eliminar Producto', producto })
    } catch (error) {
        console.error(error)
        res.redirect('/comercio/productos')
    }
}

const procesarEliminarProducto = async (req, res) => {
    try {
        const comercio = await Comercio.findOne({ usuario: req.session.usuario.id })
        await Producto.findOneAndDelete({ _id: req.params.id, comercio: comercio._id })
        req.flash('exito', 'Producto eliminado correctamente.')
        res.redirect('/comercio/productos')
    } catch (error) {
        console.error(error)
        req.flash('error', 'Error al eliminar el producto.')
        res.redirect('/comercio/productos')
    }
}

module.exports = {
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
}