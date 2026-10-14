import { ANCESTRY_KINDS, MAX_EXPANSIONS } from './constants.js'
import { uniq } from './utils.js'

// Enumera caminhos SIMPLES (sem repetir personagem) a partir de `start`, subindo (pais) ou
// descendo (filhos). `onPath` impede loops; quando o caminho volta a `start`, o ciclo é
// registrado em `selfHits` e a ramificação é interrompida.
export function walk(g, start, dir, { kinds = ANCESTRY_KINDS, maxDepth = 4, allow = null } = {}) {
  const found = new Map(), selfHits = []
  const onPath = new Set([start])
  let budget = MAX_EXPANSIONS
  const rec = (id, depth, trace) => {
    if (depth >= maxDepth) return
    for (const e of (dir === 'up' ? g.up : g.down).get(id) || []) {
      if (!kinds.includes(e.kind) || --budget < 0) continue
      const nxt = dir === 'up' ? e.parent : e.child
      if (allow && !allow.has(nxt)) continue
      const t = [...trace, e]
      if (nxt === start) { selfHits.push(t); continue }
      if (onPath.has(nxt)) continue
      if (!found.has(nxt)) found.set(nxt, [])
      found.get(nxt).push({ depth: depth + 1, trace: t })
      onPath.add(nxt)
      rec(nxt, depth + 1, t)
      onPath.delete(nxt)
    }
  }
  rec(start, 0, [])
  return { found, selfHits }
}

export const reached = (found) =>
  [...found].map(([id, paths]) => {
    paths.sort((a, b) => a.depth - b.depth)
    return { id, depth: paths[0].depth, paths, depths: uniq(paths.map((p) => p.depth)) }
  }).sort((a, b) => a.depth - b.depth)
