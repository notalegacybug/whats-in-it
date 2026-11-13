import { checkNotes } from './notesCheck'

const ids = new Set(['cas:50-00-0', 'cas:7664-93-9'])
const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ')

test('notes and caveats within the rules pass', () => {
  expect(
    checkNotes(
      {
        'cas:50-00-0': { note: 'A simple gas used to make resins.' },
        'cas:7664-93-9': { note: 'A strong acid.', caveat: 'Listed for breathing in acid mists.' },
      },
      ids,
    ),
  ).toEqual([])
})

test('exactly 30 words passes, 31 words fails, for note and caveat', () => {
  expect(checkNotes({ 'cas:50-00-0': { note: words(30), caveat: words(30) } }, ids)).toEqual([])
  const out = checkNotes({ 'cas:50-00-0': { note: words(31), caveat: `  ${words(31)}\n` } }, ids)
  expect(out).toEqual([
    'cas:50-00-0: note has 31 words (at most 30)',
    'cas:50-00-0: caveat has 31 words (at most 30)',
  ])
})

test.each(['safe', 'Unsafe', 'DANGEROUS', 'toxic', 'harmful', 'causes cancer', 'causes  Cancer', 'carcinogen', 'Carcinogenic'])(
  'the banned term "%s" fails',
  (term) => {
    const out = checkNotes({ 'cas:50-00-0': { note: `It is ${term}.` } }, ids)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatch(/^cas:50-00-0: note contains the banned term "/)
  },
)

test('a banned term in the caveat fails', () => {
  expect(checkNotes({ 'cas:50-00-0': { note: 'A gas.', caveat: 'Not toxic in food.' } }, ids)).toEqual([
    'cas:50-00-0: caveat contains the banned term "toxic"',
  ])
})

test('banned terms only count as whole words', () => {
  expect(checkNotes({ 'cas:50-00-0': { note: 'Used in safety matches and detoxification; safely stored; carcinogenesis.' } }, ids)).toEqual(
    [],
  )
})

test('a key that is not an entry id fails', () => {
  expect(checkNotes({ 'cas:50-00-1': { note: 'A gas.' } }, ids)).toEqual([
    'cas:50-00-1: no entry has this id (check for a typo)',
  ])
})
