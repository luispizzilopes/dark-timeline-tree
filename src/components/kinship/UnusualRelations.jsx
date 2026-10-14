import { Meta } from './Meta.jsx'
import { Parts } from './Parts.jsx'
import { Trace } from './Trace.jsx'

export const UnusualRelations = ({ items, detail, onGo }) => items.length > 0 && (
  <>
    <h4 className="kh">Relações incomuns</h4>
    {items.map((u, i) => (
      <div className="box gold" key={u.type + u.other + i}>
        <p><Parts parts={u.parts} onGo={onGo} /></p>
        {u.registered && <p className="note"><b>Registro da série:</b> <Parts parts={u.registered} onGo={onGo} /></p>}
        <Meta worlds={u.worlds} certainty={u.certainty} cross={u.crossWorld} />
        {(u.traces || []).map((t, k) => <Trace key={k} steps={t.steps} onGo={onGo} open={detail} label={t.parts.length === 1 ? t.parts[0] : 'Rastro'} />)}
      </div>
    ))}
  </>
)
