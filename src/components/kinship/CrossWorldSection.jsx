import { KG, WORLD } from '../../data/dataset.js'
import { displayName } from '../../domain/kinship/index.js'
import { Meta } from './Meta.jsx'
import { Parts } from './Parts.jsx'
import { Trace } from './Trace.jsx'

export const CrossWorldSection = ({ crossWorld, counterparts, detail, onGo }) => (crossWorld.length > 0 || counterparts.length > 0) && (
  <>
    <h4 className="kh">Entre mundos</h4>
    {counterparts.length > 0 && (
      <p className="note">Versões equivalentes (não são a mesma pessoa): {counterparts.map((c, i) => (
        <span key={c.id}>{i ? ', ' : ''}<button type="button" className="nm" style={{ '--c': WORLD[c.worldId]?.color }} onClick={() => onGo(c.id)}>{displayName(KG, c.id)} ({WORLD[c.worldId]?.name})</button></span>
      ))}.</p>
    )}
    {crossWorld.map((x) => (
      <div className="box" key={x.id}>
        <p><Parts parts={x.parts} onGo={onGo} /></p>
        <Meta worlds={x.worlds} certainty={x.certainty} />
        <Trace steps={x.steps} onGo={onGo} open={detail} />
      </div>
    ))}
  </>
)
