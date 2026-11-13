import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildIndex } from '../reference'
import type { RefIndex } from '../reference'
import { ReferenceGate, useReference } from './ReferenceGate'

const index: RefIndex = buildIndex({ version: 'test', builtAt: '2026-01-01', entries: [] })

function Child() {
  const { index } = useReference()
  return <p>Ready {index?.version}</p>
}

test('shows a loading status, then the children', async () => {
  render(
    <ReferenceGate load={() => Promise.resolve(index)}>
      <Child />
    </ReferenceGate>,
  )
  expect(screen.getByRole('status')).toHaveTextContent('Loading ingredient reference…')
  expect(await screen.findByText('Ready test')).toBeInTheDocument()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('on failure shows the error and hides children; Try again recovers', async () => {
  const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(index)
  render(
    <ReferenceGate load={load}>
      <Child />
    </ReferenceGate>,
  )
  expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load the ingredient reference.")
  expect(screen.queryByText(/Ready/)).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByText('Ready test')).toBeInTheDocument()
  expect(load).toHaveBeenCalledTimes(2)
})

test('does not set state after unmount', async () => {
  let resolve!: (i: RefIndex) => void
  const load = () => new Promise<RefIndex>((r) => (resolve = r))
  const err = vi.spyOn(console, 'error').mockImplementation(() => {})
  const { unmount } = render(
    <ReferenceGate load={load}>
      <Child />
    </ReferenceGate>,
  )
  unmount()
  resolve(index)
  await Promise.resolve()
  expect(err).not.toHaveBeenCalled()
  err.mockRestore()
})

test('useReference outside a gate throws a clear error', () => {
  // React re-reports render errors to window and console; silence both so output stays clean.
  const err = vi.spyOn(console, 'error').mockImplementation(() => {})
  const swallow = (e: ErrorEvent) => e.preventDefault()
  window.addEventListener('error', swallow)
  expect(() => render(<Child />)).toThrow(/ReferenceGate/)
  window.removeEventListener('error', swallow)
  err.mockRestore()
})

test('on resume, a changed reference replaces the one in use; an unchanged one is kept', async () => {
  let resume = () => {}
  const v2 = buildIndex({ version: 'v2', builtAt: '2026-01-02', entries: [] })
  const refresh = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(v2)
  render(
    <ReferenceGate
      load={() => Promise.resolve(index)}
      refresh={refresh}
      watchResume={(cb) => {
        resume = cb
        return () => {}
      }}
    >
      <Child />
    </ReferenceGate>,
  )
  expect(await screen.findByText('Ready test')).toBeInTheDocument()
  resume()
  await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
  expect(screen.getByText('Ready test')).toBeInTheDocument()
  resume()
  expect(await screen.findByText('Ready v2')).toBeInTheDocument()
})
