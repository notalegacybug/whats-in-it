import { screen } from '@testing-library/react'
import { DISCLAIMER, SOURCES_ABOUT } from '../../copy'
import { renderScreen } from '../test-helpers'
import { About } from './About'

const renderAbout = () => renderScreen(<About />, { route: '/about', path: '/about' })

test('about: heading, disclaimer and reference version', async () => {
  renderAbout()
  expect(await screen.findByRole('heading', { level: 1, name: 'About' })).toBeInTheDocument()
  expect(screen.getByText(DISCLAIMER)).toBeInTheDocument()
  expect(await screen.findByText('Reference version v-test')).toBeInTheDocument()
})

test('about: the four sources each link out safely', async () => {
  renderAbout()
  const expected: Record<string, string> = {
    'IARC Monographs': 'https://monographs.iarc.who.int/list-of-classifications',
    'US National Toxicology Program, Report on Carcinogens': 'https://ntp.niehs.nih.gov/go/roc',
    'California Proposition 65 list': 'https://oehha.ca.gov/proposition-65/proposition-65-list',
    'EU harmonised classification (CLP Annex VI)': 'https://echa.europa.eu/information-on-chemicals/annex-vi-to-clp',
  }
  expect(SOURCES_ABOUT).toHaveLength(4)
  for (const [name, url] of Object.entries(expected)) {
    const link = await screen.findByRole('link', { name })
    expect(link).toHaveAttribute('href', url)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  }
})

test('about: explains no-known-concern, has a home link, never says "safe"', async () => {
  renderAbout()
  await screen.findByText('Reference version v-test')
  expect(
    screen.getByText(
      'An ingredient that is not on these lists is shown as "No known concern on these lists". That is not a statement that it has been tested or proven harmless.',
    ),
  ).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
  expect(document.body.textContent).not.toMatch(/\bsafe\b/i)
})
