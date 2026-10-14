import { CH, WORLD } from '../../data/dataset.js'

// Partes do texto gerado: strings e { id, text } (nome clicável do personagem).
export function Parts({ parts, onGo }) {
  return parts.flat(Infinity).map((p, i) =>
    typeof p === 'string' ? <span key={i}>{p}</span> : (
      <button key={i} type="button" className="nm" style={{ '--c': WORLD[CH[p.id]?.worldId]?.color }} onClick={() => onGo(p.id)} title={WORLD[CH[p.id]?.worldId]?.name}>{p.text}</button>
    ))
}
