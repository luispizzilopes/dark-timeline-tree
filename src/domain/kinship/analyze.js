import { findCycles } from './cycles.js'
import { counterpartsOf, crossWorldLinks } from './crossWorldLinks.js'
import { directKin } from './directKin.js'
import { groupByGeneration } from './generations.js'
import { buildSummary } from './summary.js'
import { ancestorTitle, descendantTitle } from './titles.js'
import { reached, walk } from './traversal.js'
import { unusualRelations } from './unusualRelations.js'

// Análise completa de um personagem.
export function analyze(g, id, { depth = 4 } = {}) {
  if (!g.chars.has(id)) return null
  const direct = directKin(g, id)
  const up = walk(g, id, 'up', { maxDepth: depth }), down = walk(g, id, 'down', { maxDepth: depth })
  const ancestors = reached(up.found), descendants = reached(down.found)
  const cycles = findCycles(g, id)
  const unusual = unusualRelations(g, id, depth)
  const cross = crossWorldLinks(g, id, { ancestors, descendants, direct })

  return {
    id, depth,
    summary: buildSummary(g, id, { direct, ancestors, descendants, cycles, unusual, crossCount: cross.size, depth }),
    direct,
    ancestors: groupByGeneration(g, ancestors, ancestorTitle, 'up'),
    descendants: groupByGeneration(g, descendants, descendantTitle, 'down'),
    totals: { ancestors: ancestors.length, descendants: descendants.length },
    cycles, unusual, crossWorld: [...cross.values()], counterparts: counterpartsOf(g, id),
  }
}
