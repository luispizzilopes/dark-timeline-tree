// Arestas de retorno (as que fecham ciclos) via DFS.
export function findBackEdges(order, kids, hasParent) {
  const state = new Map(), back = new Set()
  const dfs = (u) => {
    state.set(u, 1)
    for (const v of kids.get(u)) {
      if (state.get(v) === 1) back.add(u + '>' + v)
      else if (!state.get(v)) dfs(v)
    }
    state.set(u, 2)
  }
  order.filter((n) => !hasParent.has(n.id)).forEach((n) => !state.get(n.id) && dfs(n.id))
  order.forEach((n) => !state.get(n.id) && dfs(n.id))
  return back
}
