import { partnerPath, spousePath } from './geometry.js'

const state = (rel, selectedId, lit) =>
  selectedId && (rel.a === selectedId || rel.b === selectedId) ? 'lit' : lit && !(lit.has(rel.a) && lit.has(rel.b)) ? 'dim' : ''

export function SpouseEdge({ rel, a, b, selectedId, lit }) {
  return (
    <g className={'spouse ' + state(rel, selectedId, lit)}>
      <path d={spousePath(a, b)} />
    </g>
  )
}

export const PartnerEdge = ({ rel, a, b, selectedId, lit }) => (
  <path className={'partner ' + state(rel, selectedId, lit)} d={partnerPath(a, b)} />
)
