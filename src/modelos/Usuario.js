const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const esquemaUsuario = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, trim: true },
    telefono: { type: String, trim: true },
    correo: { type: String, required: true, unique: true, lowercase: true, trim: true },
    nombreUsuario: { type: String, required: true, unique: true, trim: true },
    contrasena: { type: String, required: true },
    foto: { type: String, default: null },
    cedula: { type: String, trim: true },
    rol: {
        type: String,
        enum: ['cliente', 'delivery', 'comercio', 'admin'],
        required: true
    },
    activo: { type: Boolean, default: false },
    disponible: { type: Boolean, default: true }, // solo para delivery
    tokenActivacion: { type: String, default: null },
    tokenActivacionUsado: { type: Boolean, default: false },
    tokenRecuperacion: { type: String, default: null },
    tokenRecuperacionUsado: { type: Boolean, default: false },
    esAdminPorDefecto: { type: Boolean, default: false }
}, { timestamps: true })

// Encriptar contraseña antes de guardar
esquemaUsuario.pre('save', async function(next) {
    if (!this.isModified('contrasena')) return next()
    this.contrasena = await bcrypt.hash(this.contrasena, 10)
    next()
})

// Método para comparar contraseñas
esquemaUsuario.methods.compararContrasena = async function(contrasenaIngresada) {
    return await bcrypt.compare(contrasenaIngresada, this.contrasena)
}

module.exports = mongoose.model('Usuario', esquemaUsuario)