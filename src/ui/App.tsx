import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { createLocalStore } from '../products/localStore'
import type { ProductStore } from '../products/types'
import type { RefIndex } from '../reference'
import './app.css'
import { ReferenceGate } from './ReferenceGate'
import { ScanDraftProvider } from './ScanDraft'
import { StoreContext } from './StoreContext'
import { Capture } from './screens/Capture'
import { Details } from './screens/Details'
import { Home } from './screens/Home'
import { Result } from './screens/Result'
import { Review } from './screens/Review'

function Placeholder({ title }: { title: string }) {
  return (
    <main>
      <h1>{title}</h1>
    </main>
  )
}

/** Providers and routes only. The router itself lives in main.tsx so tests can supply a MemoryRouter. */
export function App({
  store,
  loadReference,
}: {
  store?: ProductStore
  loadReference?: () => Promise<RefIndex>
}) {
  // Created once: a new store per render would reopen the database every time.
  const [activeStore] = useState(() => store ?? createLocalStore())
  return (
    <StoreContext.Provider value={activeStore}>
      <ReferenceGate load={loadReference}>
        <ScanDraftProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/capture" element={<Capture />} />
            <Route path="/review" element={<Review />} />
            <Route path="/details" element={<Details />} />
            <Route path="/result/:id" element={<Result />} />
            <Route path="/scans" element={<Placeholder title="Scans" />} />
            <Route path="/search" element={<Placeholder title="Search" />} />
            <Route path="/about" element={<Placeholder title="About" />} />
          </Routes>
        </ScanDraftProvider>
      </ReferenceGate>
    </StoreContext.Provider>
  )
}
