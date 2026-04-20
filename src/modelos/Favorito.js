const mongoose = require('mongoose')

const esquemaFavorito = new mongoose.Schema({
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    comercio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comercio',
        required: true
    }
}, { timestamps: true })

module.exports = mongoose.model('Favorito', esquemaFavorito)