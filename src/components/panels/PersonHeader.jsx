import { WORLD } from '../../data/dataset.js'
import { Photo } from '../common/Photo.jsx'

export function PersonHeader({ c }) {
  const w = WORLD[c.worldId]
  return (
    <>
      <Photo c={c} />
      <p className="eyebrow" style={{ color: w.color }}>{w.name}{c.appearsInWorlds.length > 1 ? ' · visita outros mundos' : ''}</p>
      <h2>{c.name}</h2>
      {c.aliases.length > 0 && <p className="aliases">também: {c.aliases.join(' · ')}</p>}
      <dl className="facts">
        {c.birth && <><dt>Nascimento</dt><dd>{c.birth}</dd></>}
        {c.death && <><dt>Morte</dt><dd>{c.death}</dd></>}
        {c.occupation && <><dt>Ofício</dt><dd>{c.occupation}</dd></>}
        <dt>Famílias</dt><dd>{c.families.join(', ')}</dd>
      </dl>
    </>
  )
}
