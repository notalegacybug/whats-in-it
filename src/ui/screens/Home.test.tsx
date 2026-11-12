import { screen } from '@testing-library/react'
import { renderScreen } from '../test-helpers'
import { Home } from './Home'

test('home: links to My scans, Search saved products and About', async () => {
  renderScreen(<Home />, { route: '/', path: '/' })
  expect(await screen.findByRole('link', { name: 'My scans' })).toHaveAttribute('href', '/scans')
  expect(screen.getByRole('link', { name: 'Search saved products' })).toHaveAttribute('href', '/search')
  expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
})
