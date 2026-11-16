import { useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { ThemeToggle } from './components/ThemeToggle'
import { createLocalStore } from '../products/localStore'
import type { ProductStore } from '../products/types'
import type { RefIndex } from '../reference'
import './app.css'
import { ReferenceGate } from './ReferenceGate'
import { ScanDraftProvider } from './ScanDraft'
import { StoreContext } from './StoreContext'
import { About } from './screens/About'
import { Capture } from './screens/Capture'
import { Details } from './screens/Details'
import { Home } from './screens/Home'
import { MyScans } from './screens/MyScans'
import { Result } from './screens/Result'
import { Review } from './screens/Review'
import { Search } from './screens/Search'

// The router lives in main.tsx so tests can supply a MemoryRouter.
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
          <header className="app-bar">
            <Link to="/" className="app-name">
              Ingredient Safety
            </Link>
            <ThemeToggle />
          </header>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/capture" element={<Capture />} />
            <Route path="/review" element={<Review />} />
            <Route path="/details" element={<Details />} />
            <Route path="/result/:id" element={<Result />} />
            <Route path="/scans" element={<MyScans />} />
            <Route path="/search" element={<Search />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </ScanDraftProvider>
      </ReferenceGate>
    </StoreContext.Provider>
  )
}
