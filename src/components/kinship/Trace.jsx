import { CERTAINTY_PT } from '../../domain/kinship/index.js'
import { worldsText } from './constants.js'
import { Parts } from './Parts.jsx'

// Rastro verificável: cada vínculo do JSON que sustenta a conclusão.
export function Trace({ steps, onGo, open = false, label }) {
  if (!steps?.length) return null
  return (
    <details className="trace" open={open}>
      <summary>{label || 'Rastro'} · {steps.length} {steps.length === 1 ? 'vínculo' : 'vínculos'}</summary>
      <ol>
        {steps.map((s, i) => (
          <li key={s.relId + i}>
            <Parts parts={s.parts} onGo={onGo} />
            <small> · {s.kindLabel} · {worldsText(s.worlds)} · certeza {CERTAINTY_PT[s.certainty] || s.certainty} · fonte: {s.evidence} · <code>{s.relId}</code></small>
            {s.chrono && <small className="warn"> · o pai nasce depois do filho ({s.chrono.parentYear} × {s.chrono.childYear})</small>}
            {s.note && <em className="tnote">{s.note}</em>}
          </li>
        ))}
      </ol>
    </details>
  )
}
