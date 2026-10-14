import { findBackEdges } from './backEdges.js'
import { COL_W, LAYER_H } from './constants.js'
import { assignDepths } from './depths.js'
import { orderLayers } from './layerOrdering.js'

// Layout em camadas para um grafo genealógico dirigido que PODE ter ciclos.
const yearOf = (s) => {
  const m = /\d{4}/.exec(s || '')
  return m ? +m[0] : 9999
}

function assignCoordinates(layers) {
  const maxW = Math.max(...layers.map((L) => (L ? L.length : 0)))
  const pos = new Map()
  layers.forEach((L, d) => {
    if (!L) return
    const off = ((maxW - L.length) * COL_W) / 2
    L.forEach((id, i) => pos.set(id, { x: off + i * COL_W + COL_W / 2, y: d * LAYER_H + 80, layer: d }))
  })
  return { pos, width: maxW * COL_W, height: layers.length * LAYER_H + 120 }
}

export function layout(nodes, edges, spouses) {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const kids = new Map(nodes.map((n) => [n.id, []]))
  edges.forEach((e) => kids.get(e.from)?.push(e.to))
  const hasParent = new Set(edges.map((e) => e.to))
  const order = [...nodes].sort((a, b) => yearOf(a.birth) - yearOf(b.birth) || a.id.localeCompare(b.id))

  const back = findBackEdges(order, kids, hasParent)
  const fwd = edges.filter((e) => !back.has(e.from + '>' + e.to))
  const { depth, couples } = assignDepths({ nodes, fwd, kids, hasParent, spouses, byId })
  const layers = orderLayers({ nodes, edges, order, depth, couples })
  const { pos, width, height } = assignCoordinates(layers)
  return { pos, back, width, height }
}
