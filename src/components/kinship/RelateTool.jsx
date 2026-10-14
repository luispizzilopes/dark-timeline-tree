import { useMemo, useState } from 'react'
import { DATA, KG } from '../../data/dataset.js'
import { displayName, relate } from '../../domain/kinship/index.js'
import { Meta } from './Meta.jsx'
import { Parts } from './Parts.jsx'
import { Trace } from './Trace.jsx'

const norm = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const CHAR_GROUPS = DATA.worlds.map((w) => ({
  w,
  chars: DATA.characters.filter((c) => c.worldId === w.id).sort((a, b) => displayName(KG, a.id).localeCompare(displayName(KG, b.id), 'pt')),
}))

export function RelateTool({ id, graph, onGo }) {
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
