import { directKin } from './directKin.js'
import { edgeWorlds, traceSteps, weakest } from './evidence.js'
import { DERIVED_PT } from './labels.js'
import { genderOf, nm } from './naming.js'
import { relate } from './relate.js'
import { ancestorTitle, withGens } from './titles.js'
import { reached, walk } from './traversal.js'
import { uniq } from './utils.js'

// Parceiros que também são ancestrais/descendentes ou consanguíneos.
function partnerKin(g, id, depth, handled) {
  const out = []
  const c = g.chars.get(id)
  const kin = directKin(g, id)
  for (const p of [...kin.spouses, ...kin.partners]) {
    if (handled.has(p.id)) continue
    handled.add(p.id)
    const r = relate(g, id, p.id, { maxDepth: Math.max(depth, 6) })
    const rel = r.findings.filter((x) => ['ancestor', 'descendant', 'collateral', 'sibling'].includes(x.type))
    if (!rel.length) continue
    const reg = r.findings.find((x) => x.type === 'registered')
    out.push({
      type: 'partner_kin', other: p.id, worlds: uniq(rel.flatMap((f) => f.worlds)), crossWorld: rel.some((f) => f.crossWorld), certainty: weakest([p.rel, ...rel.map((f) => ({ certainty: f.certainty }))]),
      parts: [nm(g, id), ' e ', nm(g, p.id, c.worldId), ' têm uma relação afetiva, mas também são parentes: ', ...rel.flatMap((f, i) => [i ? ' E ainda: ' : '', ...f.parts])],
      traces: rel.map((f) => ({ parts: f.parts, steps: f.steps || [] })),
      registered: reg ? reg.parts : null,
    })
  }
  return out
}

// Parentescos derivados registrados nos dados e ainda não cobertos.
function registeredKin(g, id, handled) {
  const c = g.chars.get(id)
  return (g.derivedRels.get(id) || [])
    .filter((d) => !handled.has(d.other))
    .map((d) => ({
      type: 'registered', other: d.other, worlds: edgeWorlds(g, d.rel, [id, d.other]), certainty: d.rel.certainty, traces: [],
      parts: [nm(g, id), ' e ', nm(g, d.other, c.worldId), ` — ${DERIVED_PT[d.rel.kind] || d.rel.kind.replace(/_/g, ' ')}. `, d.rel.note || ''],
    }))
}

// Ancestral por mais de uma geração (colapso de linhagem).
function multiGenerationKin(g, id, depth) {
  const out = []
  const c = g.chars.get(id)
  const up = walk(g, id, 'up', { maxDepth: Math.max(depth, 8) })
  for (const r of reached(up.found)) {
    if (r.depths.length < 2) continue
    const shallow = r.paths.find((p) => p.depth === r.depths[0]), deep = r.paths.find((p) => p.depth === r.depths.at(-1))
    const gd = genderOf(g, r.id)
    out.push({
      type: 'multi_generation', other: r.id, certainty: weakest([...shallow.trace, ...deep.trace].map((e) => e.rel)),
      worlds: uniq([...shallow.trace, ...deep.trace].flatMap((e) => edgeWorlds(g, e.rel, [e.parent, e.child]))),
      parts: [nm(g, r.id, c.worldId), ' é, ao mesmo tempo, ', withGens(ancestorTitle(r.depths[0], gd), r.depths[0]), r.depths[0] === 1 ? ' (1 geração)' : '', ' e ', withGens(ancestorTitle(r.depths.at(-1), gd), r.depths.at(-1)), ' de ', nm(g, id), ' — a mesma pessoa aparece em duas gerações da linhagem.'],
      traces: [{ parts: ['Caminho mais curto'], steps: traceSteps(g, [...shallow.trace].reverse(), c.worldId) }, { parts: ['Caminho mais longo'], steps: traceSteps(g, [...deep.trace].reverse(), c.worldId) }],
    })
  }
  return out
}

export function unusualRelations(g, id, depth) {
  const handled = new Set()
  return [...partnerKin(g, id, depth, handled), ...registeredKin(g, id, handled), ...multiGenerationKin(g, id, depth)]
}
