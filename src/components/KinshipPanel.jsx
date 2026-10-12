import { useMemo, useState } from 'react'
import { CH, DATA, KG, PARADOX, WORLD } from '../data.js'
import { CERTAINTY_PT, analyze, displayName, findCycles, relate, withMinCertainty } from '../kinship.js'

const DEPTHS = [1, 2, 3, 4, 6, 8]
const CERTAINTY_OPTIONS = [[-1, 'Todas'], [1, '≥ média'], [2, '≥ alta'], [3, 'Confirmadas']]
const ANC_LABEL = ['', 'Pais', 'Avós', 'Bisavós', 'Trisavós', 'Tetravós', 'Pentavós']
const DESC_LABEL = ['', 'Filhos', 'Netos', 'Bisnetos', 'Trinetos', 'Tetranetos', 'Pentanetos']
const genLabel = (labels, n, fallback) => (labels[n] ? `${labels[n]} · ${n}ª geração` : `${fallback} de ${n}ª geração`)
const worldsText = (ids) => (ids || []).map((w) => WORLD[w]?.name || w).join(' ↔ ')

// Partes do texto gerado: strings e { id, text } (nome clicável do personagem).
function Parts({ parts, onGo }) {
  return parts.flat(Infinity).map((p, i) =>
    typeof p === 'string' ? <span key={i}>{p}</span> : (
      <button key={i} type="button" className="nm" style={{ '--c': WORLD[CH[p.id]?.worldId]?.color }} onClick={() => onGo(p.id)} title={WORLD[CH[p.id]?.worldId]?.name}>{p.text}</button>
    ))
}

function Meta({ worlds, certainty, cross }) {
  return (
    <div className="tags">
      {worlds?.length > 0 && <span className="tag">{worldsText(worlds)}</span>}
      {cross && <span className="tag">cruza mundos</span>}
      {certainty && <span className={'cert c-' + certainty}>certeza {CERTAINTY_PT[certainty] || certainty}</span>}
    </div>
  )
}

// Rastro verificável: cada vínculo do JSON que sustenta a conclusão.
function Trace({ steps, onGo, open = false, label }) {
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

function Seg({ label, value, options, onChange }) {
  return (
    <div className="focus">
      <span>{label}</span>
      {options.map(([v, l]) => <button key={v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  )
}

function Cycle({ c, detail, onGo, onParadox }) {
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

const KChip = ({ item, subject, onGo }) => (
  <button
    className="chip" style={{ '--c': WORLD[CH[item.id]?.worldId]?.color }} onClick={() => onGo(item.id)}
    title={`${item.title}${item.pathCount > 1 ? ` · ${item.pathCount} caminhos` : ''}\n${[subject, ...item.via].map((v) => displayName(KG, v)).join(' → ')}`}
  >
    <i /> {displayName(KG, item.id)}
    {item.nonBiological && <small>adotivo</small>}
    {item.cross && <small>↔ mundos</small>}
  </button>
)

function Generations({ title, groups, labels, fallback, subject, onGo }) {
  if (!groups.length) return null
  return (
    <>
      <h4 className="kh">{title}</h4>
      {groups.map((gr) => (
        <div className="row" key={gr.generation}>
          <span className="k">{genLabel(labels, gr.generation, fallback)}</span>
          <span className="v">{gr.items.map((it) => <KChip key={it.id} item={it} subject={subject} onGo={onGo} />)}</span>
        </div>
      ))}
    </>
  )
}

const norm = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const CHAR_GROUPS = DATA.worlds.map((w) => ({
  w,
  chars: DATA.characters.filter((c) => c.worldId === w.id).sort((a, b) => displayName(KG, a.id).localeCompare(displayName(KG, b.id), 'pt')),
}))

function RelateTool({ id, graph, onGo }) {
  const [other, setOther] = useState('')
  const [q, setQ] = useState('')
  const groups = useMemo(() => {
    const nq = norm(q.trim())
    return CHAR_GROUPS
      .map(({ w, chars }) => ({ w, chars: chars.filter((c) => c.id !== id && (c.id === other || !nq || norm(displayName(KG, c.id)).includes(nq))) }))
      .filter((gr) => gr.chars.length)
  }, [q, id, other])
  const r = useMemo(() => (other ? relate(graph, id, other) : null), [graph, id, other])
  return (
    <>
      <h4 className="kh">Relação com outro personagem</h4>
      <input className="kin-select" type="search" placeholder="Filtrar por nome…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filtrar personagens" />
      <select className="kin-select" value={other} onChange={(e) => setOther(e.target.value)} aria-label="Escolher personagem para comparar">
        <option value="">Escolha um personagem…</option>
        {groups.map(({ w, chars }) => (
          <optgroup key={w.id} label={w.name}>
            {chars.map((c) => <option key={c.id} value={c.id}>{displayName(KG, c.id)}</option>)}
          </optgroup>
        ))}
      </select>
      {q.trim() && !groups.length && <p className="note">Nenhum personagem encontrado.</p>}
      {r && (
        r.findings.length ? r.findings.map((f, i) => (
          <div className="box" key={i}>
            <p><Parts parts={f.parts} onGo={onGo} /></p>
            <Meta worlds={f.worlds} certainty={f.certainty} cross={f.crossWorld} />
            <Trace steps={f.steps} onGo={onGo} />
          </div>
        )) : <div className="box"><p><Parts parts={r.summary} onGo={onGo} /></p></div>
      )}
    </>
  )
}

export function KinshipSection({ id, onGo, onParadox }) {
  const [depth, setDepth] = useState(4)
  const [mode, setMode] = useState('brief')
  const [minRank, setMinRank] = useState(-1)
  const graph = useMemo(() => withMinCertainty(KG, minRank), [minRank])
  const a = useMemo(() => analyze(graph, id, { depth }), [graph, id, depth])
  const hidden = useMemo(() => (minRank < 0 ? 0 : findCycles(KG, id).length - findCycles(graph, id).length), [graph, id, minRank])
  if (!a) return null
  const detail = mode === 'detail'
  return (
    <section className="kin">
      <h3>Análise de parentesco</h3>
      <Seg label="Texto" value={mode} onChange={setMode} options={[['brief', 'Resumo'], ['detail', 'Detalhado']]} />
      <Seg label="Gerações" value={depth} onChange={setDepth} options={DEPTHS.map((d) => [d, String(d)])} />
      <Seg label="Certeza" value={minRank} onChange={setMinRank} options={CERTAINTY_OPTIONS} />
      <p className="kin-summary"><Parts parts={a.summary} onGo={onGo} /></p>

      {hidden > 0 && <p className="note">{hidden === 1 ? '1 ciclo genealógico depende' : `${hidden} ciclos genealógicos dependem`} de vínculos com certeza abaixo do filtro e {hidden === 1 ? 'foi ocultado' : 'foram ocultados'}.</p>}
      {a.cycles.length > 0 && (
        <>
          <h4 className="kh">Paradoxos genealógicos</h4>
          {a.cycles.map((c) => <Cycle key={c.id} c={c} detail={detail} onGo={onGo} onParadox={onParadox} />)}
        </>
      )}

      {a.unusual.length > 0 && (
        <>
          <h4 className="kh">Relações incomuns</h4>
          {a.unusual.map((u, i) => (
            <div className="box gold" key={u.type + u.other + i}>
              <p><Parts parts={u.parts} onGo={onGo} /></p>
              {u.registered && <p className="note"><b>Registro da série:</b> <Parts parts={u.registered} onGo={onGo} /></p>}
              <Meta worlds={u.worlds} certainty={u.certainty} cross={u.crossWorld} />
              {(u.traces || []).map((t, k) => <Trace key={k} steps={t.steps} onGo={onGo} open={detail} label={t.parts.length === 1 ? t.parts[0] : 'Rastro'} />)}
            </div>
          ))}
        </>
      )}

      <Generations title="Ancestrais" groups={a.ancestors} labels={ANC_LABEL} fallback="Ancestrais" subject={id} onGo={onGo} />
      <Generations title="Descendentes" groups={a.descendants} labels={DESC_LABEL} fallback="Descendentes" subject={id} onGo={onGo} />

      {(a.crossWorld.length > 0 || a.counterparts.length > 0) && (
        <>
          <h4 className="kh">Entre mundos</h4>
          {a.counterparts.length > 0 && (
            <p className="note">Versões equivalentes (não são a mesma pessoa): {a.counterparts.map((c, i) => (
              <span key={c.id}>{i ? ', ' : ''}<button type="button" className="nm" style={{ '--c': WORLD[c.worldId]?.color }} onClick={() => onGo(c.id)}>{displayName(KG, c.id)} ({WORLD[c.worldId]?.name})</button></span>
            ))}.</p>
          )}
          {a.crossWorld.map((x) => (
            <div className="box" key={x.id}>
              <p><Parts parts={x.parts} onGo={onGo} /></p>
              <Meta worlds={x.worlds} certainty={x.certainty} />
              <Trace steps={x.steps} onGo={onGo} open={detail} />
            </div>
          ))}
        </>
      )}

      <RelateTool key={id} id={id} graph={graph} onGo={onGo} />
    </section>
  )
}
