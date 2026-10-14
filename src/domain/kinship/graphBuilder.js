import { CERTAINTY_RANK } from './constants.js'

// Constrói o grafo de parentesco a partir do JSON bruto.
export function buildKinshipGraph(raw) {
  const chars = new Map(raw.characters.map((c) => [c.id, c]))
  const worlds = new Map(raw.worlds.map((w) => [w.id, w]))
  const g = {
    raw, chars, worlds,
    up: new Map(), down: new Map(), // id -> arestas pai→filho
    spouses: new Map(), partners: new Map(), siblingRels: new Map(), derivedRels: new Map(),
    identities: new Map(), sccCache: new Map(),
  }
  const push = (m, k, v) => { if (!m.has(k)) m.set(k, []); m.get(k).push(v) }
  for (const r of raw.relationships) {
    if (r.type === 'parent_child') {
      if (!chars.has(r.parentId) || !chars.has(r.childId)) continue
      const e = { rel: r, parent: r.parentId, child: r.childId, kind: r.kind }
      push(g.down, r.parentId, e)
      push(g.up, r.childId, e)
    } else if (r.memberIds && r.memberIds.every((m) => chars.has(m))) {
      const [a, b] = r.memberIds
      const target = { spouse: g.spouses, partner: g.partners, sibling: g.siblingRels, derived_kinship: g.derivedRels }[r.type]
      if (!target) continue
      push(target, a, { rel: r, other: b })
      push(target, b, { rel: r, other: a })
    }
  }
  for (const idn of raw.identities || []) push(g.identities, idn.characterId, idn)
  return g
}

// Visão do grafo só com vínculos de certeza >= minRank (3 confirmada, 2 alta, 1 média, 0 baixa).
// Tudo (travessia, ciclos, parentescos) passa a respeitar o corte, sem mudar a lógica.
export function withMinCertainty(g, minRank) {
  if (minRank < 0) return g
  const keep = (rel) => (CERTAINTY_RANK[rel.certainty] ?? -1) >= minRank
  const filtered = (m) => new Map([...m].map(([k, list]) => [k, list.filter((x) => keep(x.rel))]))
  return { ...g, up: filtered(g.up), down: filtered(g.down), spouses: filtered(g.spouses), partners: filtered(g.partners), siblingRels: filtered(g.siblingRels), derivedRels: filtered(g.derivedRels), sccCache: new Map() }
}
