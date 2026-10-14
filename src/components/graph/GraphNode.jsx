import { WORLD } from '../../data/dataset.js'
import { R, initials, splitName } from './geometry.js'

const worldColor = (n) => (n.group ? 'var(--amber)' : WORLD[n.homeWorld]?.color || 'var(--teal)')

export function GraphNode({ node: n, pos: p, selected, lit, onClick }) {
  const labelLines = splitName(n.name)
  const cls = ['node', selected ? 'sel' : '', lit && !lit.has(n.id) ? 'dim' : '', lit && lit.has(n.id) ? 'lit' : '', n.cycle ? 'cycle' : ''].join(' ')
  return (
    <g className={cls} transform={`translate(${p.x},${p.y})`} onClick={onClick}>
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
        {labelLines.map((l, i) => <tspan key={i} x="0" dy={i ? 14 : 0}>{l}</tspan>)}
      </text>
    </g>
  )
}
