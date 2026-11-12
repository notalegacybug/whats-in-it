import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

function Home() {
  return (
    <main>
      <h1>Ingredient Safety</h1>
      <nav aria-label="Ways to check a label">
        <ul>
          <li><Link to="/capture?mode=camera">Take a photo</Link></li>
          <li><Link to="/capture?mode=file">Choose an image</Link></li>
          <li><Link to="/capture?mode=text">Type or paste</Link></li>
        </ul>
      </nav>
    </main>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <main>
      <h1>{title}</h1>
    </main>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/capture" element={<Placeholder title="Capture" />} />
        <Route path="/review" element={<Placeholder title="Review" />} />
        <Route path="/details" element={<Placeholder title="Details" />} />
        <Route path="/result/:id" element={<Placeholder title="Result" />} />
        <Route path="/scans" element={<Placeholder title="Scans" />} />
        <Route path="/search" element={<Placeholder title="Search" />} />
        <Route path="/about" element={<Placeholder title="About" />} />
      </Routes>
    </BrowserRouter>
  );
}
