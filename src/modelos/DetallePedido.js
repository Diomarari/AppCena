const mongoose = require('mongoose')

const esquemaDetallePedido = new mongoose.Schema({
    pedido: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pedido',
        required: true
    },
    producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto',
        required: true
    },
    nombreProducto: { type: String, required: true },
    precio: { type: Number, required: true },
    foto: { type: String, default: null }
}, { timestamps: true })

module.exports = mongoose.model('DetallePedido', esquemaDetallePedido)