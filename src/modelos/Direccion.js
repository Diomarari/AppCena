const mongoose = require('mongoose')

const esquemaDireccion = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    }
}, { timestamps: true })

module.exports = mongoose.model('Direccion', esquemaDireccion)