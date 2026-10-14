import { CH, KG, WORLD } from '../../data/dataset.js'
import { displayName } from '../../domain/kinship/index.js'

export const KinChip = ({ item, subject, onGo }) => (
  <button
    className="chip" style={{ '--c': WORLD[CH[item.id]?.worldId]?.color }} onClick={() => onGo(item.id)}
    title={`${item.title}${item.pathCount > 1 ? ` · ${item.pathCount} caminhos` : ''}\n${[subject, ...item.via].map((v) => displayName(KG, v)).join(' → ')}`}
  >
    <i /> {displayName(KG, item.id)}
    {item.nonBiological && <small>adotivo</small>}
    {item.cross && <small>↔ mundos</small>}
  </button>
)
