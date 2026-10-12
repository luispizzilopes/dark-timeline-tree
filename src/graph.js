export const LAYER_H = 165
// Layout em camadas para um grafo genealógico dirigido que PODE ter ciclos.
const yearOf = (s) => {
  const m = /\d{4}/.exec(s || '')
  return m ? +m[0] : 9999
}

export function layout(nodes, edges, spouses) {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const kids = new Map(nodes.map((n) => [n.id, []]))
  edges.forEach((e) => kids.get(e.from)?.push(e.to))
  const hasParent = new Set(edges.map((e) => e.to))
  const order = [...nodes].sort((a, b) => yearOf(a.birth) - yearOf(b.birth) || a.id.localeCompare(b.id))

  // 1) arestas de retorno (fecham ciclos) via DFS
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
  const fwd = edges.filter((e) => !back.has(e.from + '>' + e.to))

  // 2) profundidade = caminho mais longo
  const depth = new Map(nodes.map((n) => [n.id, 0]))
  for (let i = 0; i < nodes.length; i++) {
    let ch = false
    fwd.forEach((e) => {
      if (depth.get(e.to) < depth.get(e.from) + 1) { depth.set(e.to, depth.get(e.from) + 1); ch = true }
    })
    if (!ch) break
  }
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
  for (let i = 0; i < nodes.length; i++) {
    let ch = false
    fwd.forEach((e) => { if (depth.get(e.to) < depth.get(e.from) + 1) { depth.set(e.to, depth.get(e.from) + 1); ch = true } })
    if (!ch) break
  }

  // 3) ordenação por camada (baricentro) + colagem de casais
  const layers = []
  order.forEach((n) => { (layers[depth.get(n.id)] ||= []).push(n.id) })
  const pos = new Map()
  const setPos = () => layers.forEach((L) => L?.forEach((id, i) => pos.set(id, i)))
  setPos()
  const nb = new Map(nodes.map((n) => [n.id, []]))
  edges.forEach((e) => { nb.get(e.from).push([e.to, 1]); nb.get(e.to).push([e.from, 1]) })
  couples.forEach((c) => { nb.get(c.a).push([c.b, 2]); nb.get(c.b).push([c.a, 2]) })
  const sweep = (L) => {
    const w = L.map((id) => {
      const n = nb.get(id)
      const tot = n.reduce((s, [, k]) => s + k, 0)
      return [id, tot ? n.reduce((s, [o, k]) => s + pos.get(o) * k, 0) / tot : pos.get(id)]
    })
    w.sort((a, b) => a[1] - b[1])
    L.splice(0, L.length, ...w.map((x) => x[0]))
    L.forEach((id, i) => pos.set(id, i))
  }
  for (let it = 0; it < 8; it++) {
    for (let i = 0; i < layers.length; i++) layers[i] && sweep(layers[i])
    for (let i = layers.length - 1; i >= 0; i--) layers[i] && sweep(layers[i])
  }
  layers.forEach((L) => {
    if (!L) return
    couples.forEach((c) => {
      const ia = L.indexOf(c.a), ib = L.indexOf(c.b)
      if (ia < 0 || ib < 0) return
      L.splice(ib, 1)
      L.splice(L.indexOf(c.a) + 1, 0, c.b)
    })
  })

  // 4) coordenadas
  const DX = 150, DY = LAYER_H
  const maxW = Math.max(...layers.map((L) => (L ? L.length : 0)))
  const out = new Map()
  layers.forEach((L, d) => {
    if (!L) return
    const off = ((maxW - L.length) * DX) / 2
    L.forEach((id, i) => out.set(id, { x: off + i * DX + DX / 2, y: d * DY + 80, layer: d }))
  })
  return { pos: out, back, width: maxW * DX, height: layers.length * DY + 120 }
}

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
