import { render, screen } from '@testing-library/react'
import { App } from './App'

test('home shows the app name and the three ways in', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Ingredient Safety' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Take a photo' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Choose an image' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Type or paste' })).toBeInTheDocument()
})
