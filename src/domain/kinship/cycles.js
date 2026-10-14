import { ANCESTRY_KINDS } from './constants.js'
import { chronoInversion, edgeWorlds, traceSteps, weakest } from './evidence.js'
import { narrateCycle } from './cycleNarrative.js'
import { walk } from './traversal.js'
import { uniq } from './utils.js'

// Componentes fortemente conexos (Tarjan): só quem está num SCC com >1 nó (ou laço) pode estar num ciclo.
function sccs(g, kinds) {
  const key = kinds.join('|')
  if (g.sccCache.has(key)) return g.sccCache.get(key)
  let idx = 0
  const index = new Map(), low = new Map(), onStack = new Set(), stack = [], comp = new Map()
  const strong = (v) => {
    index.set(v, idx); low.set(v, idx++); stack.push(v); onStack.add(v)
    for (const e of g.down.get(v) || []) {
      if (!kinds.includes(e.kind)) continue
      const w = e.child
      if (!index.has(w)) { strong(w); low.set(v, Math.min(low.get(v), low.get(w))) }
      else if (onStack.has(w)) low.set(v, Math.min(low.get(v), index.get(w)))
    }
    if (low.get(v) === index.get(v)) {
      const members = []
      let w
      do { w = stack.pop(); onStack.delete(w); members.push(w) } while (w !== v)
      const cyc = members.length > 1 || (g.down.get(v) || []).some((e) => kinds.includes(e.kind) && e.child === v)
      members.forEach((m) => comp.set(m, cyc ? new Set(members) : null))
    }
  }
  for (const id of g.chars.keys()) if (!index.has(id)) strong(id)
  g.sccCache.set(key, comp)
  return comp
}

export const isInCycle = (g, id, kinds = ANCESTRY_KINDS) => !!sccs(g, kinds).get(id)

function describeCycle(g, edges) {
  const nodes = edges.map((e) => e.parent)
  const rels = edges.map((e) => e.rel)
  const relSet = new Set(rels.map((r) => r.id))
  const paradox = (g.raw.paradoxes || []).find((p) => p.relationshipIds && p.relationshipIds.length === relSet.size && p.relationshipIds.every((i) => relSet.has(i)))
  const cyc = {
    id: edges.map((e) => e.rel.id).join('>'),
    nodes, edges,
    length: edges.length,
    genetic: edges.every((e) => e.kind === 'biological'),
    worlds: uniq([...edges.flatMap((e) => edgeWorlds(g, e.rel, [e.parent, e.child])), ...nodes.map((n) => g.chars.get(n).worldId)]),
    certainty: weakest(rels),
    paradox: paradox ? { id: paradox.id, name: paradox.name } : null,
    travelers: nodes.filter((n) => g.chars.get(n).timeTravel?.isTimeTraveler === true),
    inversions: edges.map((e) => ({ e, inv: chronoInversion(g, e) })).filter((x) => x.inv),
  }
  cyc.steps = traceSteps(g, edges)
  cyc.narrative = narrateCycle(g, cyc)
  return cyc
}

// Todos os ciclos simples (A → … → A) que passam por `id`, do menor para o maior.
export function findCycles(g, id, { kinds = ANCESTRY_KINDS, maxLen = 14 } = {}) {
  const comp = sccs(g, kinds).get(id)
  if (!comp) return []
  const { selfHits } = walk(g, id, 'down', { kinds, maxDepth: maxLen, allow: comp })
  const seen = new Set()
  return selfHits
    .filter((t) => { const k = t.map((e) => e.rel.id).join('>'); return !seen.has(k) && seen.add(k) })
    .sort((a, b) => a.length - b.length || a.map((e) => e.rel.id).join().localeCompare(b.map((e) => e.rel.id).join()))
    .map((edges) => describeCycle(g, edges))
}
