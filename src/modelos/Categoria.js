const mongoose = require('mongoose')

const esquemaCategoria = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    comercio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comercio',
        required: true
    }
}, { timestamps: true })

module.exports = mongoose.model('Categoria', esquemaCategoria)