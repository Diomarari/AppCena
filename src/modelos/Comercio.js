const mongoose = require('mongoose')

const esquemaComercio = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    nombreComercio: { type: String, required: true, trim: true },
    logo: { type: String, default: null },
    horaApertura: { type: String, required: true },
    horaCierre: { type: String, required: true },
    tipoComercio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TipoComercio',
        required: true
    }
}, { timestamps: true })

module.exports = mongoose.model('Comercio', esquemaComercio)