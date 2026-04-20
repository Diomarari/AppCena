const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Crear la carpeta si no existe
const carpetaUploads = 'public/uploads'
if (!fs.existsSync(carpetaUploads)) {
    fs.mkdirSync(carpetaUploads, { recursive: true })
}

const almacenamiento = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, carpetaUploads)
    },
    filename: (req, file, cb) => {
        const nombre = Date.now() + '-' + file.originalname.replace(/\s/g, '-')
        cb(null, nombre)
    }
})

const filtroArchivos = (req, file, cb) => {
    const tiposPermitidos = /jpeg|jpg|png|gif|webp/
    const esValido = tiposPermitidos.test(path.extname(file.originalname).toLowerCase())
    if (esValido) {
        cb(null, true)
    } else {
        cb(new Error('Solo se permiten imágenes (jpg, png, gif, webp)'))
    }
}

const subir = multer({
    storage: almacenamiento,
    fileFilter: filtroArchivos,
    limits: { fileSize: 5 * 1024 * 1024 }
})

module.exports = subir