import { useEffect, useMemo, useRef, useState } from 'react'
import { LAYER_H, layout } from '../graph.js'
import { WORLD } from '../data.js'

const R = 34

function splitName(n) {
  if (n.length <= 13) return [n]
  const i = n.lastIndexOf(' ', 13) > 0 ? n.lastIndexOf(' ', 13) : n.indexOf(' ')
  return i > 0 ? [n.slice(0, i), n.slice(i + 1)] : [n]
}
const initials = (n) => n.split(' ').map((p) => p[0]).slice(0, 2).join('')
const worldColor = (n) => (n.group ? 'var(--amber)' : WORLD[n.homeWorld]?.color || 'var(--teal)')

function edgePath(a, b, isBack) {
  if (isBack || b.y <= a.y) {
    const bulge = 90 * (a.x <= b.x ? 1 : -1) || 90
    return `M${a.x},${a.y - R} C${a.x + bulge},${a.y - R - 70} ${b.x + bulge},${b.y + R + 70} ${b.x},${b.y + R}`
  }
  const y1 = a.y + R, y2 = b.y - R, m = (y1 + y2) / 2
  return `M${a.x},${y1} C${a.x},${m} ${b.x},${m} ${b.x},${y2}`
}

export default function GraphView({ view, selected, onSelect, lit, litEdges, lines, centerToken, selectedId }) {
  const wrap = useRef(null)
  const L = useMemo(() => layout(view.nodes, view.edges, view.spouses), [view])
  const [t, setT] = useState({ x: 0, y: 0, k: 1 })
  const drag = useRef(null)
  const moved = useRef(false)

  const fit = () => {
    const el = wrap.current
    if (!el) return
    const { width: cw, height: ch } = el.getBoundingClientRect()
    const k = Math.max(Math.min(cw / (L.width + 80), ch / (L.height + 40), 1.1), 0.62)
    setT({ k, x: Math.max((cw - L.width * k) / 2, 12), y: 8 })
  }
  useEffect(fit, [L])

  useEffect(() => {
    if (!centerToken) return
    const p = L.pos.get(centerToken.id)
    const el = wrap.current
    if (!p || !el) return
    const { width: cw, height: ch } = el.getBoundingClientRect()
    setT((s) => { const k = Math.max(s.k, 0.8); return { k, x: cw / 2 - p.x * k, y: ch / 2 - p.y * k } })
  }, [centerToken])

  useEffect(() => {
    const el = wrap.current
    const onWheel = (e) => {
      e.preventDefault()
      const r = el.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top
      setT((s) => {
        const k = Math.min(2.5, Math.max(0.15, s.k * Math.exp(-e.deltaY * 0.0012)))
        return { k, x: mx - ((mx - s.x) / s.k) * k, y: my - ((my - s.y) / s.k) * k }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const down = (e) => { drag.current = { x: e.clientX, y: e.clientY, tx: t.x, ty: t.y }; moved.current = false }
  const move = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x, dy = e.clientY - d.y
    if (Math.abs(dx) + Math.abs(dy) > 4) moved.current = true
    setT((s) => ({ ...s, x: d.tx + dx, y: d.ty + dy }))
  }
  const up = () => { drag.current = null }
  const zoom = (f) => setT((s) => {
    const el = wrap.current.getBoundingClientRect(), k = Math.min(2.5, Math.max(0.15, s.k * f))
    const cx = el.width / 2, cy = el.height / 2
    return { k, x: cx - ((cx - s.x) / s.k) * k, y: cy - ((cy - s.y) / s.k) * k }
  })

  const dimNode = (id) => lit && !lit.has(id)
  const hasP = (e) => e.paradoxIds && e.paradoxIds.length > 0
  const layerLabels = [...new Set([...L.pos.values()].map((p) => p.layer))]

  return (
    <div className="graph" ref={wrap}>
      <svg onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onClick={() => { if (!moved.current) onSelect(null) }}>
        <defs>
          <clipPath id="clipc"><circle r={R - 3} /></clipPath>
          <marker id="arrowg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,1 L9,5 L0,9 z" fill="#6f8794" />
          </marker>
          <marker id="arrowy" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,1 L9,5 L0,9 z" fill="var(--gold)" />
          </marker>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,1 L9,5 L0,9 z" fill="var(--amber)" />
          </marker>
        </defs>
        <g transform={`translate(${t.x},${t.y}) scale(${t.k})`}>
          {layerLabels.map((l) => (
            <line key={l} className="rail" x1={-200} x2={L.width + 200} y1={l * LAYER_H + 80} y2={l * LAYER_H + 80} />
          ))}
          {view.edges.map((e) => {
            const a = L.pos.get(e.from), b = L.pos.get(e.to)
            if (!a || !b) return null
            if (!(hasP(e) ? lines.cycle : lines.parent)) return null
            const back = L.back.has(e.from + '>' + e.to)
            const cls = ['edge', e.kind !== 'biological' ? 'soft' : '', hasP(e) ? 'paradox' : '', back ? 'back' : '',
              litEdges ? (litEdges.has(e.id) ? 'lit' : 'dim') : lit && !(lit.has(e.from) && lit.has(e.to)) ? 'dim' : ''].join(' ')
            return <path key={e.id} className={cls} d={edgePath(a, b, back)} markerEnd={litEdges?.has(e.id) ? 'url(#arrowy)' : hasP(e) ? 'url(#arrow)' : 'url(#arrowg)'} />
          })}
          {lines.spouse && view.spouses.map((s, i) => {
            const a = L.pos.get(s.a), b = L.pos.get(s.b)
            if (!a || !b) return null
            const same = a.y === b.y
            const d2 = same
              ? `M${Math.min(a.x, b.x) + R},${a.y} L${Math.max(a.x, b.x) - R},${a.y}`
              : `M${a.x},${a.y + R} Q${(a.x + b.x) / 2},${Math.max(a.y, b.y) + R + 55} ${b.x},${b.y + R}`
            const cls = 'spouse ' + (selectedId && (s.a === selectedId || s.b === selectedId) ? 'lit' : lit && !(lit.has(s.a) && lit.has(s.b)) ? 'dim' : '')
            const mx = same ? (a.x + b.x) / 2 : (a.x + b.x) / 2, my = same ? a.y : Math.max(a.y, b.y) + R + 27
            return (
              <g key={'s' + i} className={cls}>
                <path d={d2} />
                
              </g>
            )
          })}
          {lines.partner && view.partners.map((s, i) => {
            const mine = selectedId && (s.a === selectedId || s.b === selectedId)
            const a = L.pos.get(s.a), b = L.pos.get(s.b)
            if (!a || !b) return null
            return <path key={'p' + i} className={'partner ' + (mine ? 'lit' : lit && !(lit.has(s.a) && lit.has(s.b)) ? 'dim' : '')} d={`M${a.x},${a.y + R} Q${(a.x + b.x) / 2},${Math.max(a.y, b.y) + R + 85} ${b.x},${b.y + R}`} />
          })}
          {view.nodes.map((n) => {
            const p = L.pos.get(n.id)
            const lines = splitName(n.name)
            const cls = ['node', selected === n.id ? 'sel' : '', dimNode(n.id) ? 'dim' : '', lit && lit.has(n.id) ? 'lit' : '', n.cycle ? 'cycle' : ''].join(' ')
            return (
              <g key={n.id} className={cls} transform={`translate(${p.x},${p.y})`}
                onClick={(e) => { e.stopPropagation(); if (!moved.current) onSelect(n.id) }}>
                <title>{n.name}</title>
                <circle className="halo" r={R + 5} />
                <circle className="ring" r={R} style={{ stroke: worldColor(n) }} />
                <circle r={R - 3} className="back" />
                <text className="ini" y="6" textAnchor="middle">{initials(n.name)}</text>
                {n.photo?.url && <image href={n.photo.url} x={-R} y={-R} width={2 * R} height={2 * R} clipPath="url(#clipc)" preserveAspectRatio="xMidYMid slice" />}
                {n.cycle && <g transform={`translate(${R - 6},${-R + 6})`}><circle r="10" className="badge amber" /><text y="4" textAnchor="middle" className="bt">∞</text></g>}
                {!n.cycle && n.involved && <circle className="badge-dot amber" cx={R - 6} cy={-R + 6} r="4" />}
                {n.knot === true && <circle className="badge-dot blood" cx={-R + 6} cy={R - 6} r="5"><title>Existência depende do nó temporal</title></circle>}
                {n.survives && <text className="star" x={R - 4} y={R - 2} textAnchor="middle">✦</text>}
                <text className="label" y={R + 18} textAnchor="middle">
                  {lines.map((l, i) => <tspan key={i} x="0" dy={i ? 14 : 0}>{l}</tspan>)}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
      <div className="zoom">
        <button onClick={() => zoom(1.25)} aria-label="Aproximar">+</button>
        <button onClick={() => zoom(0.8)} aria-label="Afastar">−</button>
        <button onClick={fit} aria-label="Ajustar à tela">⌖</button>
      </div>
    </div>
  )
}
