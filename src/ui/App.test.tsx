import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { buildIndex } from '../reference'
import { App } from './App'
import { fakeStore } from './test-helpers'

const load = () => Promise.resolve(buildIndex({ version: 'test', builtAt: '2026-01-01', entries: [] }))

test('home shows the app name and the three ways in', async () => {
  render(
    <MemoryRouter>
      <App store={fakeStore()} loadReference={load} />
    </MemoryRouter>,
  )
  expect(await screen.findByRole('heading', { name: 'Ingredient Safety' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Take a photo' })).toHaveAttribute('href', '/capture?mode=camera')
  expect(screen.getByRole('link', { name: 'Choose an image' })).toHaveAttribute('href', '/capture?mode=file')
  expect(screen.getByRole('link', { name: 'Type or paste' })).toHaveAttribute('href', '/capture?mode=text')
})
