import { CH, DATA, WORLD } from '../../data/dataset.js'
import { TYPE_LABEL } from '../../data/labels.js'
import { shortName } from '../../data/names.js'
import { Cert } from '../common/Cert.jsx'

function ParadoxBody({ p, onPick }) {
  return (
    <div className="body">
      <Cert v={p.certainty} />
      <ol>{p.mechanism.map((m, i) => <li key={i}>{m}</li>)}</ol>
      {p.transferChain && <ul className="versions">{p.transferChain.map((s) => <li key={s.step}><b>{s.year}</b> — {s.note}</li>)}</ul>}
      <div className="tags">{p.participants.map((pa) => (
        <button key={pa.characterId} className={'chip role-' + pa.role} style={{ '--c': WORLD[CH[pa.characterId].worldId].color }} onClick={() => onPick(p.id, pa.characterId)} title={pa.explanation}>
          <i /> {shortName(CH[pa.characterId].name)}{pa.isExistenceDependent ? ' ⏳' : ''}
        </button>))}</div>
      <p className="note"><b>Rompe-se?</b> {p.brokenByResolution.value ? 'Sim. ' : 'Não. '}{p.brokenByResolution.how}</p>
    </div>
  )
}

export function ParadoxPanel({ active, onPick }) {
  return (
    <div className="paradoxes">
      <p className="note">Um paradoxo só é marcado onde a série o sustenta: viajar no tempo, por si só, não é bootstrap.</p>
      {DATA.paradoxes.map((p) => (
        <article key={p.id} className={'pcard ' + (active === p.id ? 'on' : '')}>
          <header onClick={() => onPick(active === p.id ? null : p.id)}>
            <span className="tag">{TYPE_LABEL[p.types[0]]}</span>
            <h4>{p.name}</h4>
            <p>{p.summary}</p>
          </header>
          {active === p.id && <ParadoxBody p={p} onPick={onPick} />}
        </article>
      ))}
    </div>
  )
}
