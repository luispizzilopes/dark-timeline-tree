import { CH, GROUP_BY_SLUG, WORLD } from '../../data/dataset.js'
import { Photo } from '../common/Photo.jsx'

export function GroupPanel({ node, onGo }) {
  const g = GROUP_BY_SLUG[node.id.slice(3)]
  return (
    <div className="person">
      <Photo c={CH[node.members.find((m) => CH[m].photo.url) || node.members[0]]} />
      <p className="eyebrow">Versões entre mundos</p>
      <h2>{node.name}</h2>
      <p className="note">{g ? g.note : 'Indivíduo único que liga dois mundos.'}</p>
      <h3>Versões</h3>
      {node.members.map((m) => (
        <div className="box" key={m} style={{ borderColor: WORLD[CH[m].worldId].color }}>
          <b style={{ color: WORLD[CH[m].worldId].color }}>{WORLD[CH[m].worldId].name}</b>
          <p>{CH[m].name}</p>
          <button className="link" onClick={() => onGo(m)}>ver detalhes neste mundo →</button>
        </div>
      ))}
    </div>
  )
}
