import { Link, useLocation } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import useTheme from '../hooks/useTheme'

export default function Header() {
  const { pathname } = useLocation()
  const { theme, toggle } = useTheme()

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
          <button className="theme-toggle btn-bare" onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </nav>
      </div>
    </header>
  )
}
