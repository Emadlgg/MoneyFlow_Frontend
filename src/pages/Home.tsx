import { Link } from 'react-router-dom'
import '../assets/style/home.css'

export default function HomePage() {
  const features = [
    {
      icon: '💰',
      title: 'Múltiples Cuentas',
      description: 'Gestiona todas tus cuentas bancarias, tarjetas de crédito y efectivo en un solo lugar con total control y visibilidad.'
    },
    {
      icon: '📊',
      title: 'Reportes Visuales',
      description: 'Visualiza tus ingresos y gastos con gráficos intuitivos y reportes detallados que te ayuden a tomar mejores decisiones.'
    },
    {
      icon: '🚨',
      title: 'Alertas Inteligentes',
      description: 'Recibe notificaciones cuando te acerques a tus límites de gasto y mantén tus finanzas bajo control automáticamente.'
    },
    {
      icon: '🎯',
      title: 'Categorización',
      description: 'Organiza tus transacciones por categorías personalizables para entender mejor en qué gastas tu dinero.'
    },
    {
      icon: '💡',
      title: 'Consejos Personalizados',
      description: 'Obtén recomendaciones financieras basadas en tus hábitos de gasto para mejorar tu salud financiera.'
    },
    {
      icon: '🔒',
      title: 'Seguro y Privado',
      description: 'Tus datos están protegidos con encriptación de nivel bancario. Tu privacidad financiera es nuestra prioridad.'
    }
  ]

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Toma el control total de tus finanzas
          </h1>
          <p className="hero-subtitle">
            Gestiona múltiples cuentas, recibe alertas inteligentes y obtén insights personalizados 
            para mejorar tu salud financiera de manera simple y efectiva.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="hero-cta hero-cta--primary">
              🚀 Comenzar Gratis
            </Link>
            <Link to="/login" className="hero-cta hero-cta--secondary">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <h2 className="features-title">¿Por qué elegir MoneyFlow?</h2>
          <p className="features-subtitle">
            Todas las herramientas que necesitas para manejar tus finanzas personales 
            de forma inteligente y sin complicaciones.
          </p>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <span className="feature-icon">{feature.icon}</span>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="demo-section">
        <div className="demo-container">
          <h2 className="demo-title">Tu centro de control financiero</h2>
          <p className="demo-subtitle">
            Una interfaz clara e intuitiva que te permite ver toda tu información financiera de un vistazo.
          </p>
          
          <div className="demo-mockup">
            <div className="mockup-content">
              <div className="mockup-item">
                <h4>📈 Dashboard</h4>
                <p>Vista general de todas tus cuentas con saldos actualizados en tiempo real.</p>
              </div>
              <div className="mockup-item">
                <h4>💸 Transacciones</h4>
                <p>Registra y categoriza tus ingresos y gastos de manera rápida y sencilla.</p>
              </div>
              <div className="mockup-item">
                <h4>📊 Análisis</h4>
                <p>Gráficos y reportes detallados para entender tus patrones de gasto.</p>
              </div>
              <div className="mockup-item">
                <h4>🎯 Metas</h4>
                <p>Establece límites de gasto y recibe alertas para mantener el control.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">¿Listo para transformar tus finanzas?</h2>
          <p className="cta-subtitle">
            Únete a miles de usuarios que ya están tomando control de su dinero. 
            Es gratis y solo toma 2 minutos configurar tu cuenta.
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="hero-cta hero-cta--primary">
              ✨ Crear Cuenta Gratis
            </Link>
            <Link to="/login" className="hero-cta hero-cta--secondary">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">MoneyFlow</div>
          <p className="footer-description">
            Tu compañero inteligente para la gestión financiera personal. 
            Simple, seguro y efectivo.
          </p>
          <div className="footer-links">
            <Link to="/login" className="footer-link">Iniciar Sesión</Link>
            <Link to="/register" className="footer-link">Registrarse</Link>
            <a href="#" className="footer-link">Privacidad</a>
            <a href="#" className="footer-link">Términos</a>
            <a href="#" className="footer-link">Soporte</a>
          </div>
          <div className="footer-copyright">
            © 2024 MoneyFlow. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}