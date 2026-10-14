// Ordenação por camada (baricentro) + colagem de casais.
export function orderLayers({ nodes, edges, order, depth, couples }) {
  const layers = []
  order.forEach((n) => { (layers[depth.get(n.id)] ||= []).push(n.id) })
  const pos = new Map()
  layers.forEach((L) => L?.forEach((id, i) => pos.set(id, i)))
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
  return layers
}
