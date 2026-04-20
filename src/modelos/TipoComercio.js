const mongoose = require('mongoose')

const esquemaTipoComercio = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    icono: { type: String, default: null }
}, { timestamps: true })

module.exports = mongoose.model('TipoComercio', esquemaTipoComercio)