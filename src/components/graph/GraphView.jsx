import { useMemo } from 'react'
import { LAYER_H } from '../../domain/layout/constants.js'
import { layout } from '../../domain/layout/layoutGraph.js'
import { useViewport } from '../../hooks/useViewport.js'
import { GraphDefs } from './GraphDefs.jsx'
import { GraphNode } from './GraphNode.jsx'
import { hasParadox } from './geometry.js'
import { ParentEdge } from './ParentEdge.jsx'
import { PartnerEdge, SpouseEdge } from './RelationEdges.jsx'
import { ZoomControls } from './ZoomControls.jsx'

export default function GraphView({ view, selected, onSelect, lit, litEdges, lines, centerToken, selectedId }) {
  const L = useMemo(() => layout(view.nodes, view.edges, view.spouses), [view])
  const { wrap, transform: t, moved, fit, zoom, handlers } = useViewport(L, centerToken)
  const layerLabels = [...new Set([...L.pos.values()].map((p) => p.layer))]

  // pares de posições; relações com ponta fora da visão são ignoradas
  const ends = (rel) => {
    const a = L.pos.get(rel.a), b = L.pos.get(rel.b)
    return a && b ? { a, b } : null
  }

  return (
    <div className="graph" ref={wrap}>
      <svg {...handlers} onClick={() => { if (!moved.current) onSelect(null) }}>
        <GraphDefs />
        <g transform={`translate(${t.x},${t.y}) scale(${t.k})`}>
          {layerLabels.map((l) => (
            <line key={l} className="rail" x1={-200} x2={L.width + 200} y1={l * LAYER_H + 80} y2={l * LAYER_H + 80} />
          ))}
          {view.edges.map((e) => {
            const a = L.pos.get(e.from), b = L.pos.get(e.to)
            if (!a || !b) return null
            if (!(hasParadox(e) ? lines.cycle : lines.parent)) return null
            return <ParentEdge key={e.id} edge={e} a={a} b={b} isBack={L.back.has(e.from + '>' + e.to)} lit={lit} litEdges={litEdges} />
          })}
          {lines.spouse && view.spouses.map((s, i) => {
            const p = ends(s)
            return p && <SpouseEdge key={'s' + i} rel={s} {...p} selectedId={selectedId} lit={lit} />
          })}
          {lines.partner && view.partners.map((s, i) => {
            const p = ends(s)
            return p && <PartnerEdge key={'p' + i} rel={s} {...p} selectedId={selectedId} lit={lit} />
          })}
          {view.nodes.map((n) => (
            <GraphNode key={n.id} node={n} pos={L.pos.get(n.id)} selected={selected === n.id} lit={lit}
              onClick={(e) => { e.stopPropagation(); if (!moved.current) onSelect(n.id) }} />
          ))}
        </g>
      </svg>
      <ZoomControls onZoom={zoom} onFit={fit} />
    </div>
  )
}
