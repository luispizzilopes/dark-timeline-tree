import { PARADOX } from '../../data/dataset.js'
import { Meta } from './Meta.jsx'
import { Parts } from './Parts.jsx'
import { Trace } from './Trace.jsx'

export function CycleCard({ c, detail, onGo, onParadox }) {
  const [p0, p1, ...rest] = c.narrative.paragraphs
  return (
    <div className="box amber">
      <b>∞ Ciclo de {c.length} {c.length === 1 ? 'geração' : 'gerações'}</b>
      <Meta worlds={c.worlds} certainty={c.certainty} />
      <div className="tags"><span className="tag">{c.genetic ? 'bootstrap genealógico' : 'ciclo com vínculo não biológico'}</span></div>
      <p><Parts parts={p0} onGo={onGo} /></p>
      <p><Parts parts={p1} onGo={onGo} /></p>
      {detail && rest.map((p, i) => <p key={i}><Parts parts={p} onGo={onGo} /></p>)}
      {detail && c.narrative.nodeNotes.length > 0 && (
        <ul className="versions">{c.narrative.nodeNotes.map((n) => <li key={n.id}><Parts parts={n.parts} onGo={onGo} /></li>)}</ul>
      )}
      <Trace steps={c.steps} onGo={onGo} open={detail} label="Rastro do ciclo" />
      {c.paradox && PARADOX[c.paradox.id] && (
        <button className="link" onClick={() => onParadox(c.paradox.id)}>Ver «{c.paradox.name}» na aba Paradoxos →</button>
      )}
    </div>
  )
}
