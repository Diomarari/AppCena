
const mongoose = require('mongoose')

const conectarDB = async () => {
    try {
        console.log("URI:", process.env.MONGO_URI)
        await mongoose.connect(process.env.MONGO_URI)
        console.log('✅ Conectado a MongoDB correctamente')
    } catch (error) {
        console.error('❌ Error al conectar a MongoDB:', error)
        process.exit(1)
    }
}

module.exports = conectarDB