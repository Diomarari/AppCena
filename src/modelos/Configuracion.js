const mongoose = require('mongoose')

const esquemaConfiguracion = new mongoose.Schema({
    clave: { type: String, required: true, unique: true, trim: true },
    valor: { type: String, required: true },
    descripcion: { type: String }
}, { timestamps: true })

module.exports = mongoose.model('Configuracion', esquemaConfiguracion)