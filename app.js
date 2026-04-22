const express = require('express')
const { create } = require('express-handlebars')
const session = require('express-session')
const flash = require('connect-flash')
const path = require('path')

const ambiente = process.env.NODE_ENV || 'development'
if (ambiente === 'qa') {
    require('dotenv').config({ path: '.env.qa' })
} else {
    require('dotenv').config({ path: '.env' })
}

// Inicializar transportador de correo
const { inicializarTransportador } = require('./src/config/email')
try {
    inicializarTransportador()
} catch (error) {
    console.error('⚠️ Error inicializando correo:', error.message)
}

const conectarDB = require('./src/config/database')
const authRutas = require('./src/rutas/authRutas')
const clienteRutas = require('./src/rutas/clienteRutas')
const comercioRutas = require('./src/rutas/comercioRutas')
const deliveryRutas = require('./src/rutas/deliveryRutas')
const adminRutas = require('./src/rutas/adminRutas')
const apiRutas = require('./src/rutas/apiRutas')

const app = express()

// Conectar a la base de datos e inicializar sistema
conectarDB().then(async () => {
    const Configuracion = require('./src/modelos/Configuracion')
    const Usuario = require('./src/modelos/Usuario')

    const configExiste = await Configuracion.findOne({ clave: 'ITBIS' })
    if (!configExiste) {
        await Configuracion.create({
            clave: 'ITBIS',
            valor: '18',
            descripcion: 'Porcentaje del ITBIS aplicado a los pedidos'
        })
        console.log('✅ Configuración ITBIS creada por defecto')
    }

    const adminExiste = await Usuario.findOne({ esAdminPorDefecto: true })
    if (!adminExiste) {
        await Usuario.create({
            nombre: 'Admin',
            apellido: 'Principal',
            correo: 'admin@appcenar.com',
            nombreUsuario: 'admin',
            contrasena: 'Admin123!',
            rol: 'admin',
            activo: true,
            esAdminPorDefecto: true
        })
        console.log('✅ Admin por defecto creado: admin / Admin123!')
    }
})

// Configurar Handlebars
const hbs = create({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'src/vistas/layouts'),
    partialsDir: path.join(__dirname, 'src/vistas/parciales'),
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    },
    helpers: {
    eq: (a, b) => a?.toString() === b?.toString(),
        ne: (a, b) => a !== b,
        formatFecha: (fecha) => {
            if (!fecha) return ''
            const d = new Date(fecha)
            return d.toLocaleDateString('es-DO', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        },
        formatPrecio: (precio) => {
            if (!precio) return 'RD$ 0.00'
            return `RD$ ${parseFloat(precio).toFixed(2)}`
        }
    }
})

app.engine('.hbs', hbs.engine)
app.set('view engine', '.hbs')
app.set('views', path.join(__dirname, 'src/vistas'))

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.use(session({
    secret: process.env.SECRETO_SESION,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}))

app.use(flash())

app.use((req, res, next) => {
    res.locals.exito = req.flash('exito')
    res.locals.error = req.flash('error')
    res.locals.usuario = req.session.usuario || null
    next()
})

app.use('/', authRutas)
app.use('/cliente', clienteRutas)
app.use('/comercio', comercioRutas)
app.use('/delivery', deliveryRutas)
app.use('/admin', adminRutas)
app.use('/api', apiRutas)

app.use((err, req, res, next) => {
    console.error('💥 ERROR:', err.message)
    res.status(500).send(`<pre>ERROR: ${err.message}</pre>`)
})

app.use((req, res) => {
    res.status(404).render('auth/login', {
        error: ['La página que buscas no existe.']
    })
})

const PUERTO = process.env.PUERTO || 3000
app.listen(PUERTO, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PUERTO} en modo ${ambiente}`)
})