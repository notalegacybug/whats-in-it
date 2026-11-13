import { versionBumpProblem } from './diff'

const none = { added: [], removed: [], changed: [] }
const some = { added: [], removed: [], changed: ['cas:50-00-0'] }

test('changed content with the same version as the previous build is refused, with the fix in the message', () => {
  expect(versionBumpProblem('2026.11.1', '2026.11.1', some)).toBe(
    'Reference content changed but data/version.json was not bumped (still 2026.11.1). Bump it and rebuild.',
  )
})

test('a bumped version, an unchanged reference, or no previous build is fine', () => {
  expect(versionBumpProblem('2026.11.1', '2026.11.2', some)).toBeNull()
  expect(versionBumpProblem('2026.11.1', '2026.11.1', none)).toBeNull()
  expect(versionBumpProblem(null, '2026.11.1', { added: ['cas:50-00-0'], removed: [], changed: [] })).toBeNull()
})

test('added or removed entries count as a change', () => {
  expect(versionBumpProblem('v', 'v', { added: ['a'], removed: [], changed: [] })).not.toBeNull()
  expect(versionBumpProblem('v', 'v', { added: [], removed: ['a'], changed: [] })).not.toBeNull()
})
