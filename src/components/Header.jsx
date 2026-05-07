import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const { pathname } = useLocation()

  return (
    <header>
      <div className="container header-inner">
        <Link to="/" className="logo">Padle</Link>
        <nav>
          <Link
            to="/upload"
            className={`nav-link${pathname === '/upload' ? ' active' : ''}`}
          >
            Upload
          </Link>
        </nav>
      </div>
    </header>
  )
}
