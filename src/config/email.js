const nodemailer = require('nodemailer')
const sgTransport = require('nodemailer-sendgrid-transport')

/**
 * Crea un transportador según el servicio configurado en EMAIL_SERVICE
 * Servicios soportados: 'sendgrid', 'mailtrap', 'gmail'
 */
const crearTransportador = () => {
    const servicio = process.env.EMAIL_SERVICE || 'sendgrid'
    let transportador

    console.log(`📧 Usando servicio de correo: ${servicio.toUpperCase()}`)

    switch (servicio.toLowerCase()) {
        case 'sendgrid':
            transportador = nodemailer.createTransport(sgTransport({
                auth: {
                    api_key: process.env.SENDGRID_API_KEY
                }
            }))
            break

        case 'mailtrap':
            transportador = nodemailer.createTransport({
                host: process.env.MAILTRAP_HOST || 'smtp.mailtrap.io',
                port: process.env.MAILTRAP_PORT || 465,
                secure: true,
                auth: {
                    user: process.env.MAILTRAP_USER,
                    pass: process.env.MAILTRAP_PASS
                }
            })
            break

        case 'gmail':
            transportador = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: process.env.CORREO_USER,
                    pass: process.env.CORREO_PASS
                }
            })
            break

        default:
            throw new Error(`Servicio de correo no soportado: ${servicio}. Usa 'sendgrid', 'mailtrap' o 'gmail'`)
    }

    return transportador
}

// Crear transportador al cargar el módulo
let transportador = null

const inicializarTransportador = () => {
    try {
        transportador = crearTransportador()
    } catch (error) {
        console.error('❌ Error inicializando transportador de correo:', error.message)
        throw error
    }
}

/**
 * Envía un correo
 * @param {string} para - Email del destinatario
 * @param {string} asunto - Asunto del correo
 * @param {string} html - Contenido HTML del correo
 */
const enviarCorreo = async (para, asunto, html) => {
    if (!transportador) {
        inicializarTransportador()
    }

    try {
        const info = await transportador.sendMail({
            from: `"AppCenar 🍽️" <${process.env.CORREO_USER}>`,
            to: para,
            subject: asunto,
            html
        })

        console.log(`✅ Correo enviado a ${para}:`, info.messageId)
        return info
    } catch (error) {
        console.error(`❌ Error enviando correo a ${para}:`, error.message)
        throw error
    }
}

/**
 * Verifica la conexión del transportador (útil para debugging)
 */
const verificarConexion = async () => {
    if (!transportador) {
        inicializarTransportador()
    }

    try {
        await transportador.verify()
        console.log('✅ Conexión de correo verificada exitosamente')
        return true
    } catch (error) {
        console.error('❌ Error verificando conexión de correo:', error.message)
        return false
    }
}

module.exports = {
    inicializarTransportador,
    enviarCorreo,
    verificarConexion
}
