import { Link, useLocation } from 'react-router-dom'

export default function Navigation() {
  const location = useLocation()

  const navStyle = {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    display: 'flex',
    gap: '20px',
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '15px 30px',
    borderRadius: '50px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  }

  const linkStyle = {
    textDecoration: 'none',
    color: '#333',
    fontWeight: '500',
    padding: '8px 20px',
    borderRadius: '25px',
    transition: 'all 0.3s ease'
  }

  const activeLinkStyle = {
    ...linkStyle,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff'
  }

  return (
    <nav style={navStyle}>
      <Link to="/" style={location.pathname === '/' ? activeLinkStyle : linkStyle}>
        单个气泡
      </Link>
      <Link to="/multi" style={location.pathname === '/multi' ? activeLinkStyle : linkStyle}>
        6个气泡
      </Link>
      <Link to="/realistic" style={location.pathname === '/realistic' ? activeLinkStyle : linkStyle}>
        真实气泡
      </Link>
    </nav>
  )
}
