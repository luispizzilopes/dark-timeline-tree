// Profundidade = caminho mais longo, propagada pelas arestas diretas (sem retorno).
function relax(nodes, fwd, depth) {
  for (let i = 0; i < nodes.length; i++) {
    let ch = false
    fwd.forEach((e) => {
      if (depth.get(e.to) < depth.get(e.from) + 1) { depth.set(e.to, depth.get(e.from) + 1); ch = true }
    })
    if (!ch) break
  }
}

export function assignDepths({ nodes, fwd, kids, hasParent, spouses, byId }) {
  const depth = new Map(nodes.map((n) => [n.id, 0]))
  relax(nodes, fwd, depth)

  // ancestralidade (para não igualar profundidade de casal que é ancestral/descendente)
  const reach = (a, b) => {
    const seen = new Set([a]), st = [a]
    while (st.length) for (const v of kids.get(st.pop())) if (!seen.has(v)) { if (v === b) return true; seen.add(v); st.push(v) }
    return false
  }
  const couples = spouses.filter((s) => byId.has(s.a) && byId.has(s.b) && !reach(s.a, s.b) && !reach(s.b, s.a))

  // raízes descem até ficar logo acima do 1º filho / ao lado do cônjuge
  nodes.filter((n) => !hasParent.has(n.id)).forEach((n) => {
    const cd = fwd.filter((e) => e.from === n.id).map((e) => depth.get(e.to))
    let t = cd.length ? Math.min(...cd) - 1 : 0
    const sp = couples.map((c) => (c.a === n.id ? c.b : c.b === n.id ? c.a : null)).filter(Boolean).find((o) => hasParent.has(o))
    if (sp !== undefined) t = Math.min(t, depth.get(sp))
    depth.set(n.id, Math.max(0, t))
  })
  for (let i = 0; i < 6; i++)
    couples.forEach((c) => {
      const d = Math.max(depth.get(c.a), depth.get(c.b))
      ;[c.a, c.b].forEach((x) => { if (depth.get(x) < d && !hasParent.has(x)) depth.set(x, d) })
    })
  relax(nodes, fwd, depth)
  return { depth, couples }
}
