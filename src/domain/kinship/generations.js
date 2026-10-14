import { crosses } from './evidence.js'
import { genderOf } from './naming.js'

// Agrupa por geração; `dir` diz se a travessia subiu ('up') ou desceu ('down') para montar o caminho citável.
export const groupByGeneration = (g, list, title, dir) => {
  const by = new Map()
  list.forEach((r) => {
    const best = r.paths[0]
    const item = {
      id: r.id, generation: r.depth, title: title(r.depth, genderOf(g, r.id)), pathCount: r.paths.length,
      nonBiological: best.trace.some((e) => e.kind !== 'biological'),
      cross: best.trace.some((e) => crosses(g, e)),
      via: best.trace.map((e) => (dir === 'up' ? e.parent : e.child)),
    }
    if (!by.has(r.depth)) by.set(r.depth, [])
    by.get(r.depth).push(item)
  })
  return [...by].sort((x, y) => x[0] - y[0]).map(([generation, items]) => ({ generation, items }))
}
