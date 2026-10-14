// Todos os alcançáveis a partir de `startId` subindo ('up') ou descendo ('down') pelas arestas pai→filho.
export function neighborsClosure(edges, startId, dir) {
  const next = new Map()
  edges.forEach((e) => {
    const [a, b] = dir === 'up' ? [e.to, e.from] : [e.from, e.to]
    if (!next.has(a)) next.set(a, [])
    next.get(a).push(b)
  })
  const seen = new Set(), st = [startId]
  while (st.length) for (const v of next.get(st.pop()) || []) if (!seen.has(v)) { seen.add(v); st.push(v) }
  return seen
}
