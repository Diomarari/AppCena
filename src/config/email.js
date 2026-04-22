const nodemailer = require('nodemailer')
const sgTransport = require('nodemailer-sendgrid-transport')
const SibApiV3Sdk = require('sib-api-v3-sdk')


const crearTransportador = () => {
    const servicio = process.env.EMAIL_SERVICE || 'brevo'
    let transportador

    console.log(`📧 Usando servicio de correo: ${servicio.toUpperCase()}`)

    switch (servicio.toLowerCase()) {
        case 'brevo':
            const defaultClient = SibApiV3Sdk.ApiClient.instance
            const apiKey = defaultClient.authentications['api-key']
            apiKey.apiKey = process.env.BREVO_API_KEY

            transportador = {
                tipo: 'brevo',
                apiKey: process.env.BREVO_API_KEY,
                from: process.env.BREVO_FROM || process.env.CORREO_USER
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
            throw new Error(`Servicio de correo no soportado: ${servicio}. Usa 'brevo', 'sendgrid', 'mailtrap' o 'gmail'`)
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
 * @param {string} para 
 * @param {string} asunto 
 * @param {string} html 
 */
const enviarCorreo = async (para, asunto, html) => {
    if (!transportador) {
        inicializarTransportador()
    }

    try {
        let info

        if (transportador.tipo === 'brevo') {
            // Usar API de Brevo (Sendinblue)
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
            
            sendSmtpEmail.to = [{ email: para }]
            sendSmtpEmail.sender = { 
                name: 'AppCenar 🍽️',
                email: transportador.from
            }
            sendSmtpEmail.subject = asunto
            sendSmtpEmail.htmlContent = html

            const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
            
            info = await apiInstance.sendTransacEmail(sendSmtpEmail)

            console.log(`✅ Correo enviado a ${para}:`, info.messageId)
        } else if (transportador.tipo === 'nodemailer') {
            // Usar nodemailer (SendGrid, Mailtrap, Gmail) en caso de
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


const verificarConexion = async () => {
    if (!transportador) {
        inicializarTransportador()
    }

    try {
        if (transportador.tipo === 'brevo') {
            if (!transportador.apiKey) {
                throw new Error('BREVO_API_KEY no está configurado')
            }
            console.log('✅ Configuración de Brevo verificada')
            return true
        } else {
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
