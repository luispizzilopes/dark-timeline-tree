import { CH, PARADOX } from '../../data/dataset.js'
import { TYPE_LABEL } from '../../data/labels.js'
import { Cert } from '../common/Cert.jsx'

const triState = (v) => (v === true ? 'sim' : v === false ? 'não' : 'não estabelecido')

function BootstrapBox({ bp, onParadox }) {
  return (
    <div className={'box ' + (bp.isInvolved ? 'amber' : '')}>
      <b>{bp.isInvolved ? (bp.isExistenceDependent ? '∞ Existência depende de um ciclo' : '∞ Envolvido em um ciclo') : 'Sem paradoxo de bootstrap'}</b>
      {bp.isInvolved && (
        <>
          <div className="tags">{bp.types.map((t) => <span key={t} className="tag">{TYPE_LABEL[t]}</span>)}</div>
          {bp.roles.map((r) => (
            <button key={r.paradoxId} className="link" onClick={() => onParadox(r.paradoxId)}>
              {PARADOX[r.paradoxId].name} <small>({r.role.replace(/_/g, ' ')})</small>
            </button>
          ))}
          <p>{bp.brokenByResolution ? 'O ciclo se rompe com a resolução do nó.' : ''}</p>
        </>
      )}
    </div>
  )
}

export function TimeSection({ c, onGo, onParadox }) {
  const ex = c.existsAfterFinalResolution
  return (
    <>
      <h3>Tempo</h3>
      <BootstrapBox bp={c.bootstrapParadox} onParadox={onParadox} />
      <div className="box">
        <b>Viagem no tempo:</b> {triState(c.timeTravel.isTimeTraveler)}
        {c.timeTravel.notes && <p>{c.timeTravel.notes}</p>}
      </div>
      <div className={'box ' + (c.knotDependence.dependsOnKnot ? 'blood' : '')}>
        <b>Depende do nó temporal:</b> {triState(c.knotDependence.dependsOnKnot)} <Cert v={c.knotDependence.certainty} />
        <p>{c.knotDependence.reason}</p>
      </div>
      <div className={'box ' + (ex.value ? 'gold' : '')}>
        <b>Após o desfecho:</b> {ex.value ? 'existe' : 'deixa de existir'} <Cert v={ex.certainty} />
        <p>{ex.notes}</p>
        {ex.survivesAs && <button className="link" onClick={() => onGo(ex.survivesAs)}>✦ permanece como {CH[ex.survivesAs].name}</button>}
      </div>
    </>
  )
}
