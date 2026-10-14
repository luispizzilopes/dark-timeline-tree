import { WORLD } from '../../data/dataset.js'

export function Photo({ c }) {
  const p = c.photo
  return (
    <div className="portrait" style={{ '--c': WORLD[c.worldId]?.color }}>
      {p.url ? <img src={p.url} alt={c.name} /> : <div className="noimg">?</div>}
      {p.kind === 'equivalent_version_proxy' && <span className="proxy">foto de outra versão</span>}
    </div>
  )
}
