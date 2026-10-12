import { KinshipSection } from './KinshipPanel.jsx'
import { CH, CERTAINTY_LABEL, DATA, GROUP_BY_SLUG, PARADOX, TYPE_LABEL, WORLD, shortName } from '../data.js'

const Chip = ({ id, onGo }) => {
  const c = CH[id]
  if (!c) return null
  return (
    <button className="chip" style={{ '--c': WORLD[c.worldId]?.color }} onClick={() => onGo(id)} title={WORLD[c.worldId]?.name}>
      <i /> {shortName(c.name)}
    </button>
  )
}
const Row = ({ label, ids, onGo }) =>
  ids.length ? (
    <div className="row"><span className="k">{label}</span><span className="v">{ids.map((i) => <Chip key={i} id={i} onGo={onGo} />)}</span></div>
  ) : null
const Cert = ({ v }) => <span className={'cert c-' + v}>{CERTAINTY_LABEL[v] || v}</span>

function Photo({ c }) {
  const p = c.photo
  return (
    <div className="portrait" style={{ '--c': WORLD[c.worldId]?.color }}>
      {p.url ? <img src={p.url} alt={c.name} /> : <div className="noimg">?</div>}
      {p.kind === 'equivalent_version_proxy' && <span className="proxy">foto de outra versão</span>}
    </div>
  )
}

export function PersonPanel({ id, onGo, onFocus, focusMode, onParadox }) {
  const c = CH[id]
  const w = WORLD[c.worldId]
  const bp = c.bootstrapParadox
  const ex = c.existsAfterFinalResolution
  const cp = Object.entries(c.counterparts)
  return (
    <div className="person">
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

      <div className="focus">
        <span>Destacar</span>
        {[['up', 'Ancestrais'], ['down', 'Descendentes'], ['both', 'Ambos']].map(([m, l]) => (
          <button key={m} className={focusMode === m ? 'on' : ''} onClick={() => onFocus(focusMode === m ? 'none' : m)}>{l}</button>
        ))}
      </div>

      <h3>Família</h3>
      <Row label="Pais biológicos" ids={c.parents.biological} onGo={onGo} />
      <Row label="Pais adotivos" ids={c.parents.adoptive} onGo={onGo} />
      <Row label="Pais (natureza incerta)" ids={c.parents.unknownNature} onGo={onGo} />
      <Row label="Filhos" ids={c.children.biological} onGo={onGo} />
      <Row label="Filhos adotivos" ids={c.children.adoptive} onGo={onGo} />
      <Row label="Irmãos" ids={c.siblings.full} onGo={onGo} />
      <Row label="Meio-irmãos" ids={c.siblings.half} onGo={onGo} />
      <Row label="Irmãos (outros)" ids={[...c.siblings.step, ...c.siblings.unspecified]} onGo={onGo} />
      {c.partners.length > 0 && (
        <div className="row"><span className="k">Cônjuges / parceiros</span>
          <span className="v">{c.partners.map((p) => (
            <span key={p.relationshipId} className="pp"><Chip id={p.personId} onGo={onGo} /><small>{(p.kind || p.status || '').replace(/_/g, ' ')}</small></span>
          ))}</span></div>
      )}

      <KinshipSection id={id} onGo={onGo} onParadox={onParadox} />

      <h3>Tempo</h3>
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
      <div className="box">
        <b>Viagem no tempo:</b> {c.timeTravel.isTimeTraveler === true ? 'sim' : c.timeTravel.isTimeTraveler === false ? 'não' : 'não estabelecido'}
        {c.timeTravel.notes && <p>{c.timeTravel.notes}</p>}
      </div>
      <div className={'box ' + (c.knotDependence.dependsOnKnot ? 'blood' : '')}>
        <b>Depende do nó temporal:</b> {c.knotDependence.dependsOnKnot === true ? 'sim' : c.knotDependence.dependsOnKnot === false ? 'não' : 'não estabelecido'} <Cert v={c.knotDependence.certainty} />
        <p>{c.knotDependence.reason}</p>
      </div>
      <div className={'box ' + (ex.value ? 'gold' : '')}>
        <b>Após o desfecho:</b> {ex.value ? 'existe' : 'deixa de existir'} <Cert v={ex.certainty} />
        <p>{ex.notes}</p>
        {ex.survivesAs && <button className="link" onClick={() => onGo(ex.survivesAs)}>✦ permanece como {CH[ex.survivesAs].name}</button>}
      </div>

      {c.temporalVersions.length > 0 && (
        <>
          <h3>Versões no tempo</h3>
          <ul className="versions">
            {c.temporalVersions.map((v, i) => <li key={i}><b>{v.label}</b> {v.years && <em>{v.years}</em>}{v.ageApprox && <em> · ~{v.ageApprox} anos</em>}{v.note && <span> — {v.note}</span>}</li>)}
          </ul>
        </>
      )}
      {c.identities.length > 0 && (
        <>
          <h3>Identidades</h3>
          {c.identities.map((iid) => {
            const idn = DATA.identities.find((x) => x.id === iid)
            return <div key={iid} className="box"><ul className="versions">{idn.names.map((n, i) => <li key={i}><b>{n.label}</b>{n.context && <span> — {n.context}</span>}</li>)}</ul>{idn.note && <p>{idn.note}</p>}</div>
          })}
        </>
      )}
      {cp.length > 0 && (
        <>
          <h3>Em outros mundos</h3>
          <div className="row"><span className="v">{cp.map(([, i]) => <Chip key={i} id={i} onGo={onGo} />)}</span></div>
        </>
      )}
      {c.notes && <p className="note">{c.notes}</p>}
    </div>
  )
}

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
          {active === p.id && (
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
          )}
        </article>
      ))}
    </div>
  )
}

export function AboutPanel() {
  const m = DATA.meta
  return (
    <div className="about">
      <p className="quote">“O começo é o fim, e o fim é o começo.”</p>
      <p>{m.counts.characters} personagens · {m.counts.relationships} relações · {m.counts.paradoxes} paradoxos.</p>
      {DATA.worlds.map((w) => (
        <div key={w.id} className="box" style={{ borderColor: w.color }}>
          <b style={{ color: w.color }}>{w.name}</b>
          <p>{w.description}</p>
          <p><em>{w.status}</em></p>
        </div>
      ))}
      <h3>Fontes</h3>
      <ul className="versions">{m.sources.map((s) => <li key={s.name}><b>{s.name}</b> — {s.use}</li>)}</ul>
    </div>
  )
}
