import { useState } from 'react'
import { nextTheme, readTheme, saveTheme, type Theme } from '../../theme'

const LABEL: Record<Theme, string> = { system: 'Auto', light: 'Light', dark: 'Dark' }
const SPOKEN: Record<Theme, string> = { system: 'same as phone', light: 'light', dark: 'dark' }

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme)
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Theme: ${SPOKEN[theme]}. Tap to change.`}
      onClick={() => {
        const next = nextTheme(theme)
        saveTheme(next)
        setTheme(next)
      }}
    >
      <span className={`theme-dot ${theme}`} aria-hidden="true" />
      {LABEL[theme]}
    </button>
  )
}
