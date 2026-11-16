import { applyTheme, nextTheme, readTheme, saveTheme } from './theme'

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

test('with nothing saved the theme follows the phone setting', () => {
  expect(readTheme()).toBe('system')
  applyTheme('system')
  expect(document.documentElement.dataset.theme).toBeUndefined()
})

test('a saved choice is read back and applied to the page', () => {
  saveTheme('dark')
  expect(readTheme()).toBe('dark')
  expect(document.documentElement.dataset.theme).toBe('dark')
  saveTheme('system')
  expect(document.documentElement.dataset.theme).toBeUndefined()
})

test('an unknown saved value falls back to the phone setting', () => {
  localStorage.setItem('theme', 'purple')
  expect(readTheme()).toBe('system')
})

test('the button cycles phone setting, light, dark', () => {
  expect(nextTheme('system')).toBe('light')
  expect(nextTheme('light')).toBe('dark')
  expect(nextTheme('dark')).toBe('system')
})

test('blocked storage does not break the app', () => {
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(() => saveTheme('dark')).not.toThrow()
  expect(document.documentElement.dataset.theme).toBe('dark')
  spy.mockRestore()
})
