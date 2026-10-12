import { useEffect, useMemo, useState } from 'react'
import GraphView from './components/GraphView.jsx'
import { AboutPanel, GroupPanel, ParadoxPanel, PersonPanel } from './components/Panels.jsx'
import { CH, DATA, PARADOX, VIEWS, WORLD, buildView } from './data.js'
import { neighborsClosure } from './graph.js'

// Triquetra de Dark: três ovais entrelaçadas (sem anel externo)
const TQ_PATHS = ["M50.00,65.59A27,27 0 0 1 50.00,18.82A27,27 0 0 1 50.00,65.59Z", "M36.50,42.21A27,27 0 0 1 77.00,65.59A27,27 0 0 1 36.50,42.21Z", "M63.50,42.21A27,27 0 0 1 23.00,65.59A27,27 0 0 1 63.50,42.21Z"]
const TQ_CROSS = [[63.5, 42.2, 0], [36.5, 42.2, 1], [50.0, 65.6, 2]]
export const Triquetra = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="18 14 64 64" fill="none" strokeLinejoin="round" aria-hidden>
    {TQ_PATHS.map((d, i) => <path key={i} d={d} pathLength="1" stroke="currentColor" strokeWidth="2.6" />)}
    {TQ_CROSS.map(([x, y, o], i) => (
      <g key={i} clipPath={`url(#tqc${i})`}>
        <clipPath id={`tqc${i}`}><circle cx={x} cy={y} r="3.4" /></clipPath>
        <path d={TQ_PATHS[o]} pathLength="1" stroke="#05070a" strokeWidth="5" />
        <path d={TQ_PATHS[o]} pathLength="1" stroke="currentColor" strokeWidth="2.6" />
      </g>
    ))}
  </svg>
)

export default function App() {
  const [viewId, setViewId] = useState('jonas_world')
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('about')
  const [focusMode, setFocusMode] = useState('none')
  const [paradoxId, setParadoxId] = useState(null)
  const [overlay, setOverlay] = useState('none')
  const [lines, setLines] = useState({ parent: true, cycle: true, spouse: true, partner: true })
  const toggleLine = (k) => setLines((l) => ({ ...l, [k]: !l[k] }))
  const [query, setQuery] = useState('')
  const [center, setCenter] = useState(null)
  const [intro, setIntro] = useState(true)
  const [sheet, setSheet] = useState(true)

  useEffect(() => { const t = setTimeout(() => setIntro(false), 2600); return () => clearTimeout(t) }, [])

  const view = useMemo(() => buildView(viewId), [viewId])
  const nodeIds = useMemo(() => new Set(view.nodes.map((n) => n.id)), [view])
  const toNode = (cid) => (viewId === 'consolidated' ? 'cg_' + CH[cid].canonicalSlug : cid)

  const select = (id, { go = false } = {}) => {
    setSelected(id)
    if (id) { setTab('person'); setSheet(true); if (go) setCenter({ id, n: Date.now() }) }
  }
  const onGo = (cid) => {
    const c = CH[cid]
    if (viewId === 'consolidated') return select('cg_' + c.canonicalSlug, { go: true })
    if (!nodeIds.has(cid)) { setViewId(c.worldId); setParadoxId(null); setSelected(cid); setTab('person'); setTimeout(() => setCenter({ id: cid, n: Date.now() }), 60); return }
    select(cid, { go: true })
  }
  const openVersion = (cid) => {
    setViewId(CH[cid].worldId); setParadoxId(null); setFocusMode('none'); setOverlay('none')
    setSelected(cid); setTab('person'); setSheet(true)
    setTimeout(() => setCenter({ id: cid, n: Date.now() }), 80)
  }
  const changeView = (v) => { setViewId(v); setSelected(null); setFocusMode('none'); setParadoxId(null) }

  const onParadox = (pid, charId) => {
    if (pid === null) return setParadoxId(null)
    const p = PARADOX[pid]
    setParadoxId(pid)
    setTab('paradox')
    const need = p.cyclePath ? p.cyclePath : p.participants.map((x) => x.characterId)
    if (viewId !== 'consolidated' && !need.every((i) => nodeIds.has(i))) {
      const w = p.worldIds.find((x) => need.every((i) => CH[i].worldId === x || i === 'cw_unknown'))
      if (w) setViewId(w); else setViewId('consolidated')
      setSelected(null)
    }
    if (charId) setTimeout(() => select(viewId === 'consolidated' ? 'cg_' + CH[charId].canonicalSlug : charId, { go: true }), 60)
  }

  // destaque: paradoxo > foco de linhagem > overlay > busca
  const { lit, litEdges } = useMemo(() => {
    const q = query.trim().toLowerCase()
    let set = null, es = null
    if (paradoxId) {
      const p = PARADOX[paradoxId]
      set = new Set(p.participants.map((x) => toNode(x.characterId)).filter((i) => nodeIds.has(i)))
      es = new Set(view.edges.filter((e) => e.paradoxIds.includes(paradoxId)).map((e) => e.id))
    } else if (selected && focusMode !== 'none' && nodeIds.has(selected)) {
      set = new Set([selected])
      if (focusMode !== 'down') neighborsClosure(view.edges, selected, 'up').forEach((i) => set.add(i))
      if (focusMode !== 'up') neighborsClosure(view.edges, selected, 'down').forEach((i) => set.add(i))
    } else if (selected && nodeIds.has(selected) && overlay === 'none') {
      set = new Set([selected])
      es = new Set()
      view.edges.forEach((e) => { if (e.from === selected || e.to === selected) { set.add(e.from); set.add(e.to); es.add(e.id) } })
      ;[...view.spouses, ...view.partners].forEach((r) => { if (r.a === selected) set.add(r.b); if (r.b === selected) set.add(r.a) })
    } else if (overlay === 'knot') set = new Set(view.nodes.filter((n) => n.knot === true).map((n) => n.id))
    else if (overlay === 'survive') set = new Set(view.nodes.filter((n) => n.survives).map((n) => n.id))
    else if (overlay === 'cycle') { set = new Set(view.nodes.filter((n) => n.cycle).map((n) => n.id)); es = new Set(view.edges.filter((e) => e.paradoxIds.length).map((e) => e.id)) }
    if (q) {
      const m = new Set(view.nodes.filter((n) => n.name.toLowerCase().includes(q)).map((n) => n.id))
      set = set ? new Set([...set].filter((i) => m.has(i))) : m
    }
    return { lit: set, litEdges: es }
  }, [paradoxId, selected, focusMode, overlay, query, view, nodeIds])

  const selNode = selected && view.nodes.find((n) => n.id === selected)
  const dirty = !!(selected || paradoxId || focusMode !== 'none' || overlay !== 'none' || query)
  const clearAll = () => { setSelected(null); setParadoxId(null); setFocusMode('none'); setOverlay('none'); setQuery(''); setCenter({ id: null, n: Date.now() }) }
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && clearAll()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })
  const info = VIEWS.find((v) => v.id === viewId)
  const stats = view.nodes.length

  return (
    <div className="app">
      <div className={'intro ' + (intro ? '' : 'gone')}>
        <Triquetra size={120} />
        <p>Sic mundus creatus est</p>
      </div>
      <div className="fog" aria-hidden />

      <header className="top">
        <div className="brand"><Triquetra size={34} /><div><h1>DARK</h1><span>A Árvore do Tempo · Winden</span></div></div>
        <nav className="worlds" aria-label="Mundos">
          {VIEWS.map((v) => (
            <button key={v.id} className={viewId === v.id ? 'on' : ''} style={{ '--c': WORLD[v.id]?.color || 'var(--amber)' }} onClick={() => changeView(v.id)}>
              <b>{v.label}</b><small>{v.sub}</small>
            </button>
          ))}
        </nav>
        <input className="search" type="search" placeholder="Buscar personagem…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </header>

      <div className="toolbar">
        <span className="count">{stats} {viewId === 'consolidated' ? 'pessoas (todas as versões)' : 'personagens'}</span>
        {[['none', 'Tudo'], ['cycle', '∞ Ciclos'], ['knot', '⏳ Dependem do nó'], ['survive', '✦ Sobrevivem']].map(([k, l]) => (
          <button key={k} className={'pill ' + (overlay === k ? 'on' : '')} onClick={() => { setOverlay(k); setParadoxId(null) }}>{l}</button>
        ))}
        <button className="pill clear" disabled={!dirty} onClick={clearAll} title="Esc">✕ Limpar seleção</button>
        <span className="hint">arraste · role para zoom · clique em um rosto</span>
      </div>

      <main>
        <GraphView view={view} selected={selected} onSelect={(id) => select(id)} lit={lit} litEdges={litEdges} lines={lines} selectedId={selected} centerToken={center} />
        <aside className={'side ' + (sheet ? 'open' : '')}>
          <button className="grab" onClick={() => setSheet(!sheet)} aria-label="Painel">{sheet ? '▾' : '▴'}</button>
          <div className="tabs">
            {[['person', 'Personagem'], ['paradox', 'Paradoxos'], ['about', 'Mundos']].map(([k, l]) => (
              <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>
          <div className="scroll">
            {tab === 'person' && (selNode
              ? selNode.group ? <GroupPanel node={selNode} onGo={openVersion} /> : <PersonPanel id={selected} onGo={onGo} onFocus={setFocusMode} focusMode={focusMode} onParadox={onParadox} />
              : <p className="empty">Selecione um rosto no grafo para ver família, versões no tempo e papel nos paradoxos.</p>)}
            {tab === 'paradox' && <ParadoxPanel active={paradoxId} onPick={onParadox} />}
            {tab === 'about' && <AboutPanel />}
          </div>
        </aside>
      </main>
      <footer>
        <ul className="legend" aria-label="Legenda (clique nos tipos de linha para ocultar/mostrar)">
          <li><span className="lg amber">∞</span> paradoxo de bootstrap (membro do ciclo)</li>
          <li><span className="lg blood" /> existência depende do nó temporal</li>
          <li><span className="lg star">✦</span> permanece no Mundo de Origem</li>
          <li><button type="button" className={"lgbtn " + (lines.parent ? "" : "off")} aria-pressed={lines.parent} title="Mostrar/ocultar" onClick={() => toggleLine("parent")}><span className="lg line" /> pai → filho (fina, com seta)</button></li>
          <li><button type="button" className={"lgbtn " + (lines.cycle ? "" : "off")} aria-pressed={lines.cycle} title="Mostrar/ocultar" onClick={() => toggleLine("cycle")}><span className="lg line amberl" /> aresta do ciclo</button></li>
          <li><button type="button" className={"lgbtn " + (lines.partner ? "" : "off")} aria-pressed={lines.partner} title="Mostrar/ocultar" onClick={() => toggleLine("partner")}><span className="lg line par" /> relação afetiva (tracejada, vermelha)</button></li>
          <li><button type="button" className={"lgbtn " + (lines.spouse ? "" : "off")} aria-pressed={lines.spouse} title="Mostrar/ocultar" onClick={() => toggleLine("spouse")}><span className="lg line spl" /> casamento (grossa, laranja)</button></li>
        </ul>
        <span className="credit">{info.label} · dados: Dark Wiki &amp; série</span>
      </footer>
    </div>
  )
}
