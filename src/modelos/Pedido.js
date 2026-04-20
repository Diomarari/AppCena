const mongoose = require('mongoose')

const esquemaPedido = new mongoose.Schema({
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    comercio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comercio',
        required: true
    },
    delivery: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        default: null
    },
    direccion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Direccion',
        required: true
    },
    estado: {
        type: String,
        enum: ['pendiente', 'en proceso', 'completado'],
        default: 'pendiente'
    },
    subtotal: { type: Number, required: true },
    itbis: { type: Number, required: true },
    total: { type: Number, required: true },
    fechaPedido: { type: Date, default: Date.now }
}, { timestamps: true })

module.exports = mongoose.model('Pedido', esquemaPedido)