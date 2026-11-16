import { Link } from 'react-router-dom'

export function Home() {
  return (
    <main>
      <h1>Ingredient Safety</h1>
      <p className="lede">Check a food or cosmetic label against published cancer hazard lists.</p>
      <nav aria-label="Ways to check a label">
        <ul className="actions">
          <li>
            <Link to="/capture?mode=camera" className="action">
              Take a photo
              <span>Point your camera at the ingredients</span>
            </Link>
          </li>
          <li>
            <Link to="/capture?mode=file" className="action">
              Choose an image
              <span>Use a screenshot or saved photo</span>
            </Link>
          </li>
          <li>
            <Link to="/capture?mode=text" className="action">
              Type or paste
              <span>Paste a list or a product description</span>
            </Link>
          </li>
        </ul>
      </nav>
      <nav aria-label="More">
        <ul className="more">
          <li><Link to="/scans">My scans</Link></li>
          <li><Link to="/search">Search saved products</Link></li>
          <li><Link to="/about">About</Link></li>
        </ul>
      </nav>
    </main>
  )
}
