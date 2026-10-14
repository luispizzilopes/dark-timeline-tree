import { crosses } from './evidence.js'
import { lineFinding } from './lineFinding.js'
import { relate } from './relate.js'
import { uniq } from './utils.js'

// Vínculos que atravessam mundos: reaproveita os caminhos já enumerados.
export function crossWorldLinks(g, id, { ancestors, descendants, direct }) {
  const c = g.chars.get(id)
  const cross = new Map()
  const keep = (rid, f) => { if (f && !cross.has(rid)) cross.set(rid, { id: rid, parts: f.parts, steps: f.steps || [], worlds: f.worlds, certainty: f.certainty }) }
  const leavesWorld = (r) => g.chars.get(r.id).worldId !== c.worldId || r.paths[0].trace.some((e) => crosses(g, e))
  ancestors.forEach((r) => { if (leavesWorld(r)) keep(r.id, lineFinding(g, id, r.id, 'ancestor', r.paths)) })
  descendants.forEach((r) => { if (leavesWorld(r)) keep(r.id, lineFinding(g, id, r.id, 'descendant', r.paths)) })
  uniq([...direct.siblings, ...direct.spouses, ...direct.partners].map((x) => x.id)).forEach((rid) => {
    if (cross.has(rid) || g.chars.get(rid).worldId === c.worldId) return
    keep(rid, relate(g, id, rid, { maxDepth: 2 }).findings[0])
  })
  return cross
}

// Versões equivalentes do personagem em outros mundos.
export function counterpartsOf(g, id) {
  return (g.raw.crossWorldConnections?.counterpartGroups || [])
    .filter((grp) => Object.values(grp.members).includes(id))
    .flatMap((grp) => Object.values(grp.members).filter((m) => m !== id && g.chars.has(m)).map((m) => ({ id: m, worldId: g.chars.get(m).worldId })))
}
