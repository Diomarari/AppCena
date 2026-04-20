const mongoose = require('mongoose')

const esquemaProducto = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    precio: { type: Number, required: true },
    foto: { type: String, default: null },
    activo: { type: Boolean, default: true },
    categoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categoria',
        required: true
    },
    comercio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comercio',
        required: true
    }
}, { timestamps: true })

module.exports = mongoose.model('Producto', esquemaProducto)