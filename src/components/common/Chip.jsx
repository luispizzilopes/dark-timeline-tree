import { CH, WORLD } from '../../data/dataset.js'
import { shortName } from '../../data/names.js'

export const Chip = ({ id, onGo }) => {
  const c = CH[id]
  if (!c) return null
  return (
    <button className="chip" style={{ '--c': WORLD[c.worldId]?.color }} onClick={() => onGo(id)} title={WORLD[c.worldId]?.name}>
      <i /> {shortName(c.name)}
    </button>
  )
}
