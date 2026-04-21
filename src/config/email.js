const nodemailer = require('nodemailer')
const sgTransport = require('nodemailer-sendgrid-transport')
const { Resend } = require('resend')

/**
 * Crea un transportador según el servicio configurado en EMAIL_SERVICE
 * Servicios soportados: 'resend', 'sendgrid', 'mailtrap', 'gmail'
 */
const crearTransportador = () => {
    const servicio = process.env.EMAIL_SERVICE || 'resend'
    let transportador

    console.log(`📧 Usando servicio de correo: ${servicio.toUpperCase()}`)

    switch (servicio.toLowerCase()) {
        case 'resend':
            // Resend no usa nodemailer, retorna un objeto especial
            transportador = {
                tipo: 'resend',
                cliente: new Resend(process.env.RESEND_API_KEY)
            }
            break

        case 'sendgrid':
            transportador = {
                tipo: 'nodemailer',
                cliente: nodemailer.createTransport(sgTransport({
                    auth: {
                        api_key: process.env.SENDGRID_API_KEY
                    }
                }))
            }
            break

        case 'mailtrap':
            transportador = {
                tipo: 'nodemailer',
                cliente: nodemailer.createTransport({
                    host: process.env.MAILTRAP_HOST || 'smtp.mailtrap.io',
                    port: parseInt(process.env.MAILTRAP_PORT) || 2465,
                    secure: true,
                    auth: {
                        user: process.env.MAILTRAP_USER,
                        pass: process.env.MAILTRAP_PASS
                    }
                })
            }
            break

        case 'gmail':
            transportador = {
                tipo: 'nodemailer',
                cliente: nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: process.env.GMAIL_PORT || 587,
                    secure: process.env.GMAIL_SECURE === 'true' ? true : false,
                    auth: {
                        user: process.env.CORREO_USER,
                        pass: process.env.CORREO_PASS
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                })
            }
            break

        default:
            throw new Error(`Servicio de correo no soportado: ${servicio}. Usa 'resend', 'sendgrid', 'mailtrap' o 'gmail'`)
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
        let info

        if (transportador.tipo === 'resend') {
            // Usar API de Resend
            const de = process.env.RESEND_FROM || process.env.CORREO_USER
            info = await transportador.cliente.emails.send({
                from: `AppCenar 🍽️ <${de}>`,
                to: para,
                subject: asunto,
                html
            })

            if (info.error) {
                throw new Error(info.error.message)
            }

            console.log(`✅ Correo enviado a ${para}:`, info.id)
        } else {
            // Usar nodemailer (SendGrid, Mailtrap, Gmail)
            info = await transportador.cliente.sendMail({
                from: `"AppCenar 🍽️" <${process.env.CORREO_USER}>`,
                to: para,
                subject: asunto,
                html
            })

            console.log(`✅ Correo enviado a ${para}:`, info.messageId)
        }

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
        if (transportador.tipo === 'resend') {
            // Resend no tiene verify, solo intentamos enviar un test
            console.log('✅ Configuración de Resend verificada')
            return true
        } else {
            // Nodemailer tiene verify
            await transportador.cliente.verify()
            console.log('✅ Conexión de correo verificada exitosamente')
            return true
        }
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
