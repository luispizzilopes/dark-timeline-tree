import { WORLD } from '../../data/dataset.js'
import { VIEWS } from '../../data/views.js'
import { Triquetra } from '../brand/Triquetra.jsx'

export const Header = ({ viewId, onChangeView, query, onQuery }) => (
  <header className="top">
    <div className="brand"><Triquetra size={34} /><div><h1>DARK</h1><span>A Árvore do Tempo · Winden</span></div></div>
    <nav className="worlds" aria-label="Mundos">
      {VIEWS.map((v) => (
        <button key={v.id} className={viewId === v.id ? 'on' : ''} style={{ '--c': WORLD[v.id]?.color || 'var(--amber)' }} onClick={() => onChangeView(v.id)}>
          <b>{v.label}</b><small>{v.sub}</small>
        </button>
      ))}
    </nav>
    <input className="search" type="search" placeholder="Buscar personagem…" value={query} onChange={(e) => onQuery(e.target.value)} />
  </header>
)
