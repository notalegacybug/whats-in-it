// 'system' follows the phone's light/dark setting; the others force one. The same key and attribute are
// used by the small inline script in index.html, which applies the choice before the first paint.
export type Theme = 'system' | 'light' | 'dark'

const KEY = 'theme'
const BAR_COLOUR = { light: '#0f4c5c', dark: '#0c1a20' } as const

export function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme
  // The phone's status bar matches the header.
  const dark = theme === 'dark' || (theme === 'system' && !!globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? BAR_COLOUR.dark : BAR_COLOUR.light)
}

export function saveTheme(theme: Theme): void {
  try {
    if (theme === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, theme)
  } catch {
    // Storage can be blocked (private mode); the choice still applies until the app closes.
  }
  applyTheme(theme)
}

export function nextTheme(theme: Theme): Theme {
  return theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
}
