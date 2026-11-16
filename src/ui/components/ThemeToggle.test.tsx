import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from './ThemeToggle'

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

test('theme button names the current theme and switches on tap', async () => {
  const user = userEvent.setup()
  render(<ThemeToggle />)
  const button = screen.getByRole('button', { name: 'Theme: same as phone. Tap to change.' })
  await user.click(button)
  expect(screen.getByRole('button', { name: 'Theme: light. Tap to change.' })).toBeInTheDocument()
  await user.click(button)
  expect(screen.getByRole('button', { name: 'Theme: dark. Tap to change.' })).toBeInTheDocument()
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(localStorage.getItem('theme')).toBe('dark')
})
