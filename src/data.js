import raw from '../dark-genealogia.json'

export const DATA = raw
export const CH = Object.fromEntries(raw.characters.map((c) => [c.id, c]))
export const WORLD = Object.fromEntries(raw.worlds.map((w) => [w.id, w]))
export const PARADOX = Object.fromEntries(raw.paradoxes.map((p) => [p.id, p]))
export const GROUP_BY_SLUG = Object.fromEntries(raw.crossWorldConnections.counterpartGroups.map((g) => [g.slug, g]))

export const VIEWS = [
  { id: 'origin_world', label: 'Mundo de Origem', sub: 'Ursprungswelt' },
  { id: 'jonas_world', label: 'Mundo de Jonas', sub: 'Adam' },
  { id: 'martha_world', label: 'Mundo de Martha', sub: 'Eva' },
  { id: 'consolidated', label: 'Os Três Mundos', sub: 'Nó' },
]

export const shortName = (n) => n.split(' (')[0]
const isCycle = (c) => c.bootstrapParadox.roles.some((r) => r.role === 'cycle_member')

const nodeOf = (c) => ({
  id: c.id,
  name: shortName(c.name),
  photo: c.photo,
  worldIds: c.appearsInWorlds,
  homeWorld: c.worldId,
  cycle: isCycle(c),
  involved: c.bootstrapParadox.isInvolved,
  knot: c.knotDependence.dependsOnKnot,
  survives: c.worldId === 'origin_world' && c.existsAfterFinalResolution.value,
  birth: c.birth,
  paradoxIds: c.bootstrapParadox.paradoxIds,
})

// Visão por mundo ou consolidada -> { nodes, edges (pai→filho), spouses, partners }
export function buildView(viewId) {
  const rels = raw.relationships
  if (viewId === 'consolidated') {
    const co = raw.familyTrees.consolidated
    const bySlug = {}
    raw.characters.forEach((c) => (bySlug[c.canonicalSlug] ||= []).push(c))
    const nodes = co.nodes.map((g) => {
      const members = bySlug[g.slug] || []
      const first = members.find((m) => m.photo.url) || members[0]
      return {
        id: g.id, name: shortName(g.name), photo: first.photo, worldIds: g.worldsPresent, group: true, members: members.map((m) => m.id),
        cycle: members.some(isCycle), involved: members.some((m) => m.bootstrapParadox.isInvolved),
        knot: members.some((m) => m.knotDependence.dependsOnKnot === true),
        survives: members.some((m) => m.worldId === 'origin_world' && m.existsAfterFinalResolution.value),
        birth: first.birth, paradoxIds: [...new Set(members.flatMap((m) => m.bootstrapParadox.paradoxIds))],
      }
    })
    const edges = co.edges.map((e) => ({ id: e.parentGroupId + '>' + e.childGroupId + e.kind, from: e.parentGroupId, to: e.childGroupId, kind: e.kind, paradoxIds: e.paradoxIds, worlds: e.worlds }))
    const seen = new Set(), spouses = [], partners = []
    rels.filter((r) => r.type === 'spouse' || r.type === 'partner').forEach((r) => {
      const [a, b] = r.memberIds.map((i) => 'cg_' + CH[i].canonicalSlug)
      const k = [a, b].sort().join('|') + r.type
      if (a === b || seen.has(k)) return
      seen.add(k)
      ;(r.type === 'spouse' ? spouses : partners).push({ a, b, kind: r.kind || r.status })
    })
    return { nodes, edges, spouses, partners }
  }
  const ids = new Set(raw.characters.filter((c) => c.worldId === viewId || (c.id === 'cw_unknown' && viewId !== 'origin_world')).map((c) => c.id))
  const nodes = [...ids].map((i) => nodeOf(CH[i]))
  const edges = rels
    .filter((r) => r.type === 'parent_child' && ids.has(r.parentId) && ids.has(r.childId))
    .map((r) => ({ id: r.id, from: r.parentId, to: r.childId, kind: r.kind, paradoxIds: r.paradoxIds || [], worlds: [r.worldId] }))
  const pick = (t) => rels.filter((r) => r.type === t && r.memberIds.every((m) => ids.has(m))).map((r) => ({ a: r.memberIds[0], b: r.memberIds[1], kind: r.kind || r.status }))
  return { nodes, edges, spouses: pick('spouse'), partners: pick('partner') }
}

export const CERTAINTY_LABEL = { confirmed: 'confirmado', high: 'alta', medium: 'média', low: 'baixa', not_established: 'não estabelecida' }
export const TYPE_LABEL = {
  genealogical_bootstrap: 'Bootstrap genealógico',
  information_object_bootstrap: 'Bootstrap de objeto/informação',
  temporal_causal_loop: 'Ciclo causal temporal',
}
