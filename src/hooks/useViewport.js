import { useEffect, useRef, useState } from 'react'

const MIN_K = 0.15, MAX_K = 2.5

// Pan/zoom de um canvas SVG: ajuste à tela, centralização em um nó, roda do mouse e arrasto.
export function useViewport(layout, centerToken) {
  const wrap = useRef(null)
  const [t, setT] = useState({ x: 0, y: 0, k: 1 })
  const drag = useRef(null)
  const moved = useRef(false)

  const fit = () => {
    const el = wrap.current
    if (!el) return
    const { width: cw, height: ch } = el.getBoundingClientRect()
    const k = Math.max(Math.min(cw / (layout.width + 80), ch / (layout.height + 40), 1.1), 0.62)
    setT({ k, x: Math.max((cw - layout.width * k) / 2, 12), y: 8 })
  }
  useEffect(fit, [layout])

  useEffect(() => {
    if (!centerToken) return
    const p = layout.pos.get(centerToken.id)
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
        const k = Math.min(MAX_K, Math.max(MIN_K, s.k * Math.exp(-e.deltaY * 0.0012)))
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
    const el = wrap.current.getBoundingClientRect(), k = Math.min(MAX_K, Math.max(MIN_K, s.k * f))
    const cx = el.width / 2, cy = el.height / 2
    return { k, x: cx - ((cx - s.x) / s.k) * k, y: cy - ((cy - s.y) / s.k) * k }
  })

  return { wrap, transform: t, moved, fit, zoom, handlers: { onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerLeave: up } }
}
