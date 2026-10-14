import { neighborsClosure } from './layout/neighborsClosure.js'

// Destaque: paradoxo > foco de linhagem > seleção > overlay; a busca restringe o resultado.
// Devolve { lit: Set de nós | null, litEdges: Set de arestas | null }.
export function computeHighlight({ view, nodeIds, paradox, selected, focusMode, overlay, query, toNode }) {
  const q = query.trim().toLowerCase()
  let set = null, es = null
  if (paradox) {
    set = new Set(paradox.participants.map((x) => toNode(x.characterId)).filter((i) => nodeIds.has(i)))
    es = new Set(view.edges.filter((e) => e.paradoxIds.includes(paradox.id)).map((e) => e.id))
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
}
