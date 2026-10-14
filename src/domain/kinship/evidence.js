import { CERTAINTY_RANK } from './constants.js'
import { EVIDENCE_PT, PARENT_KIND_PT } from './labels.js'
import { genderOf, nm } from './naming.js'
import { parentTitle } from './titles.js'
import { uniq, yearOf } from './utils.js'

// Mundos a que uma aresta pertence (o do vínculo, ou os das pontas).
export function edgeWorlds(g, rel, ids) {
  if (rel.worldId && rel.worldId !== 'cross_world' && g.worlds.has(rel.worldId)) return [rel.worldId]
  return uniq(ids.map((i) => g.chars.get(i)?.worldId).filter(Boolean))
}

// Menor certeza entre os vínculos.
export const weakest = (rels) => {
  const ranks = rels.map((r) => CERTAINTY_RANK[r.certainty]).filter((x) => x !== undefined)
  if (!ranks.length) return null
  const min = Math.min(...ranks)
  return Object.keys(CERTAINTY_RANK).find((k) => CERTAINTY_RANK[k] === min)
}

// Indício de viagem no tempo: o "pai" nasceu depois do "filho".
export function chronoInversion(g, e) {
  const p = yearOf(g.chars.get(e.parent)?.birth), c = yearOf(g.chars.get(e.child)?.birth)
  return p !== null && c !== null && p > c ? { parentYear: p, childYear: c } : null
}

// Uma aresta cruza mundos quando o dado a marca assim ou quando as pontas moram em mundos diferentes.
export const crosses = (g, e) => e.rel.worldId === 'cross_world' || g.chars.get(e.parent).worldId !== g.chars.get(e.child).worldId

// Passo verificável: "X é pai de Y" + metadados do vínculo que o originou.
function stepOf(g, e, ctx) {
  return {
    relId: e.rel.id,
    parts: [nm(g, e.parent, ctx), ' é ', parentTitle(e.kind, genderOf(g, e.parent)), ' de ', nm(g, e.child, ctx)],
    kind: e.kind,
    kindLabel: PARENT_KIND_PT[e.kind] || e.kind,
    worlds: edgeWorlds(g, e.rel, [e.parent, e.child]),
    crossWorld: e.rel.worldId === 'cross_world',
    certainty: e.rel.certainty,
    evidence: EVIDENCE_PT[e.rel.evidence] || e.rel.evidence,
    note: e.rel.note || null,
    chrono: chronoInversion(g, e),
  }
}
// Rastro sempre em ordem "de cima para baixo" (ancestral → descendente).
export const traceSteps = (g, edges, ctx) => edges.map((e) => stepOf(g, e, ctx))
