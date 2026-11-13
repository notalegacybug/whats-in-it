import { buildIndex } from './index'

test('buildIndex keeps the hazard lists the reference was built from', () => {
  expect(buildIndex({ version: 'v', builtAt: 'b', sources: ['NTP'], entries: [] }).sources).toEqual(['NTP'])
})

test('buildIndex: a reference without sources has checked no lists', () => {
  expect(buildIndex({ version: 'v', builtAt: 'b', entries: [] }).sources).toEqual([])
})
