import { collateralFinding } from './collateral.js'
import { directKin } from './directKin.js'
import { edgeWorlds } from './evidence.js'
import { DERIVED_PT } from './labels.js'
import { lineFinding } from './lineFinding.js'
import { nm, worldName } from './naming.js'
import { siblingTitle } from './titles.js'
import { walk } from './traversal.js'
import { uniq } from './utils.js'

// Relação entre duas pessoas: achados de linha direta, irmandade, casamento, parceria,
// parentesco registrado e colateral.
export function relate(g, a, b, { maxDepth = 10 } = {}) {
  const out = { a, b, findings: [], summary: [] }
  if (!g.chars.has(a) || !g.chars.has(b)) return out
  const ca = g.chars.get(a), cb = g.chars.get(b)
  const B = nm(g, b, ca.worldId)
  const add = (f) => out.findings.push({ crossWorld: false, ...f, worlds: f.worlds || uniq([ca.worldId, cb.worldId]) })
  if (a === b) { add({ type: 'identity', parts: [nm(g, a), ' é a própria pessoa selecionada.'] }); return out }
  if (ca.canonicalSlug && ca.canonicalSlug === cb.canonicalSlug)
    add({ type: 'counterpart', parts: [nm(g, a), ` (${worldName(g, ca.worldId)}) e `, nm(g, b), ` (${worldName(g, cb.worldId)}) são versões equivalentes em mundos diferentes: NÃO são a mesma pessoa e o vínculo entre elas não é de parentesco.`] })

  const up = walk(g, a, 'up', { maxDepth }), down = walk(g, a, 'down', { maxDepth })
  const anc = up.found.get(b), des = down.found.get(b)
  if (anc) add(lineFinding(g, a, b, 'ancestor', anc))
  if (des) add(lineFinding(g, a, b, 'descendant', des))
  if (anc && des) add({ type: 'mutual', parts: [nm(g, a), ' e ', B, ' são ancestrais um do outro: o vínculo forma um ciclo genealógico (paradoxo de bootstrap).'] })

  const kin = directKin(g, a)
  kin.siblings.filter((s) => s.id === b).forEach((s) => add({ type: 'sibling', parts: [B, ' é ', siblingTitle(s.kind, cb.gender), ' de ', nm(g, a), '.'], certainty: s.rel.certainty, worlds: edgeWorlds(g, s.rel, [a, b]) }))
  kin.spouses.filter((s) => s.id === b).forEach((s) => add({ type: 'spouse', parts: [B, ' é ', 'cônjuge', ' de ', nm(g, a), s.kind ? ` (${s.kind.replace(/_/g, ' ')})` : '', '.'], certainty: s.rel.certainty, worlds: edgeWorlds(g, s.rel, [a, b]), crossWorld: s.rel.worldId === 'cross_world' }))
  kin.partners.filter((s) => s.id === b).forEach((s) => add({ type: 'partner', parts: [nm(g, a), ' e ', B, ` têm uma relação afetiva (${(s.kind || '').replace(/_/g, ' ')}).`], certainty: s.rel.certainty, worlds: edgeWorlds(g, s.rel, [a, b]), crossWorld: s.rel.worldId === 'cross_world' }))
  ;(g.derivedRels.get(a) || []).filter((d) => d.other === b).forEach((d) =>
    add({ type: 'registered', parts: [nm(g, a), ' e ', B, ` — parentesco registrado: ${DERIVED_PT[d.rel.kind] || d.rel.kind.replace(/_/g, ' ')}. `, d.rel.note || ''], certainty: d.rel.certainty, worlds: edgeWorlds(g, d.rel, [a, b]) }))

  const collateral = collateralFinding(g, a, b, up, { maxDepth, hasSiblingFinding: out.findings.some((f) => f.type === 'sibling') })
  if (collateral) add(collateral)

  out.summary = out.findings.length ? out.findings[0].parts : ['Nenhum vínculo de parentesco registrado entre ', nm(g, a), ' e ', nm(g, b), ` em até ${maxDepth} gerações.`]
  out.crossWorld = ca.worldId !== cb.worldId || out.findings.some((f) => f.crossWorld)
  return out
}
