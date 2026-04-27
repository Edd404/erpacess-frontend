import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => useContext(ThemeContext)

export const LIGHT = {
  bg:       '#F5F5F7',
  surface:  '#FFFFFF',
  sidebar:  '#0C0C0E',
  ink:      '#0A0A0B',
  ink2:     '#3A3A3C',
  ink3:     '#6B6B70',
  ink4:     '#AEAEB2',
  ink5:     '#D1D1D6',
  ink6:     '#F2F2F7',
  blue:     '#0A66FF',
  blueL:    '#EEF4FF',
  green:    '#12A150',
  greenL:   '#EDFAF3',
  amber:    '#C47D00',
  amberL:   '#FFF8E7',
  red:      '#D93025',
  redL:     '#FFF0EE',
  shadow:   '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
  shadowMd: '0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
}

export const DARK = {
  bg:       '#0A0A0B',
  surface:  '#1C1C1E',
  sidebar:  '#000000',
  ink:      '#FFFFFF',
  ink2:     '#E5E5EA',
  ink3:     '#AEAEB2',
  ink4:     '#636366',
  ink5:     '#3A3A3C',
  ink6:     '#2C2C2E',
  blue:     '#409CFF',
  blueL:    '#1C2F4A',
  green:    '#30D158',
  greenL:   '#1A3025',
  amber:    '#FFD60A',
  amberL:   '#2E2700',
  red:      '#FF453A',
  redL:     '#3A1A1A',
  shadow:   '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
  shadowMd: '0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('theme') === 'dark' }
    catch { return false }
  })

  const T = dark ? DARK : LIGHT

  useEffect(() => {
    try { localStorage.setItem('theme', dark ? 'dark' : 'light') }
    catch {}
    document.documentElement.style.setProperty('--bg', T.bg)
    document.documentElement.style.setProperty('--surface', T.surface)
    document.documentElement.style.setProperty('--ink', T.ink)
    document.body.style.background = T.bg
    document.body.style.colorScheme = dark ? 'dark' : 'light'
  }, [dark, T.bg, T.surface, T.ink])

  const toggle = () => setDark(d => !d)

  return (
    <ThemeContext.Provider value={{ dark, toggle, T }}>
      {children}
    </ThemeContext.Provider>
  )
}
