// Verifica que el usuario esté logueado
const verificarSesion = (req, res, next) => {
    if (!req.session.usuario) {
        req.flash('error', 'Debes iniciar sesión para acceder a esta página.')
        return res.redirect('/')
    }
    next()
}

// Verifica que el usuario tenga el rol correcto
const verificarRol = (...roles) => {
    return (req, res, next) => {
        if (!req.session.usuario) {
            req.flash('error', 'Debes iniciar sesión para acceder a esta página.')
            return res.redirect('/')
        }
        if (!roles.includes(req.session.usuario.rol)) {
            req.flash('error', 'No tienes permisos para acceder a esta sección.')
            return res.redirect('/')
        }
        next()
    }
}

// Verifica que si ya está logueado no vuelva al login
const redirigirSiLogueado = (req, res, next) => {
    if (req.session.usuario) {
        const rol = req.session.usuario.rol
        if (rol === 'cliente') return res.redirect('/cliente/home')
        if (rol === 'comercio') return res.redirect('/comercio/home')
        if (rol === 'delivery') return res.redirect('/delivery/home')
        if (rol === 'admin') return res.redirect('/admin/home')
    }
    next()
}

module.exports = { verificarSesion, verificarRol, redirigirSiLogueado }