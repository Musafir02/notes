import { useState, useEffect } from 'react'

const STORAGE_KEY = 'padle-theme'
const DEFAULT = 'dark'

export default function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(STORAGE_KEY) || DEFAULT,
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggle }
}
