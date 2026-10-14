import { crosses, edgeWorlds, traceSteps, weakest } from './evidence.js'
import { nm } from './naming.js'
import { collateralTitle } from './titles.js'
import { plural, uniq } from './utils.js'
import { walk } from './traversal.js'

// Parentesco colateral: ancestral comum mais próximo cujos caminhos até A e B só se encontram nele
// (descarta falsos "tios" quando um é ancestral do outro dentro de um ciclo).
// `up` é a travessia ascendente de A já calculada; devolve um achado ou null.
export function collateralFinding(g, a, b, up, { maxDepth, hasSiblingFinding }) {
  const ca = g.chars.get(a), cb = g.chars.get(b)
  const upB = walk(g, b, 'up', { maxDepth })
  let best = null
  for (const [id, pas] of up.found) {
    const pbs = upB.found.get(id)
    if (!pbs) continue
    for (const x of pas) for (const y of pbs) {
      const nodesX = new Set(x.trace.flatMap((e) => [e.parent, e.child])), nodesY = new Set(y.trace.flatMap((e) => [e.parent, e.child]))
      nodesX.delete(id); nodesY.delete(id)
      if ([...nodesX].some((n) => nodesY.has(n)) || nodesX.has(b) || nodesY.has(a)) continue
      const near = Math.min(x.depth, y.depth) === 1 ? Math.abs(x.depth - y.depth) <= 2 : Math.min(x.depth, y.depth) <= 3 && Math.abs(x.depth - y.depth) <= 1
      if (!near) continue
      const sum = x.depth + y.depth
      if (!best || sum < best.sum) best = { sum, items: [{ id, x, y }] }
      else if (sum === best.sum && !best.items.some((it) => it.id === id)) best.items.push({ id, x, y })
    }
  }
  if (!best || (best.items[0].x.depth === 1 && best.items[0].y.depth === 1 && hasSiblingFinding)) return null

  const { x, y } = best.items[0]
  const edgesA = [...x.trace].reverse(), edgesB = [...y.trace].reverse()
  const all = [...edgesA, ...edgesB]
  return {
    type: 'collateral', degree: [x.depth, y.depth], certainty: weakest(all.map((e) => e.rel)),
    steps: [...traceSteps(g, edgesA, ca.worldId), ...traceSteps(g, edgesB, ca.worldId)],
    worlds: uniq(all.flatMap((e) => edgeWorlds(g, e.rel, [e.parent, e.child]))), crossWorld: all.some((e) => crosses(g, e)),
    parts: [nm(g, b, ca.worldId), ' é ', collateralTitle(x.depth, y.depth, best.items.length, cb.gender), ' de ', nm(g, a), ', com ', ...best.items.flatMap((it, i) => [i ? ' e ' : '', nm(g, it.id, ca.worldId)]), ` como ancestral comum mais próximo (${x.depth} e ${y.depth} gerações).`],
  }
}
