import { Link } from 'react-router-dom'

export function Home() {
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
      <nav aria-label="More">
        <ul>
          <li><Link to="/scans">My scans</Link></li>
          <li><Link to="/search">Search saved products</Link></li>
          <li><Link to="/about">About</Link></li>
        </ul>
      </nav>
    </main>
  )
}
