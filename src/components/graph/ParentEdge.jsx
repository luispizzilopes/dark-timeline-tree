import { edgePath, hasParadox } from './geometry.js'

export function ParentEdge({ edge: e, a, b, isBack, lit, litEdges }) {
  const cls = ['edge', e.kind !== 'biological' ? 'soft' : '', hasParadox(e) ? 'paradox' : '', isBack ? 'back' : '',
    litEdges ? (litEdges.has(e.id) ? 'lit' : 'dim') : lit && !(lit.has(e.from) && lit.has(e.to)) ? 'dim' : ''].join(' ')
  const marker = litEdges?.has(e.id) ? 'url(#arrowy)' : hasParadox(e) ? 'url(#arrow)' : 'url(#arrowg)'
  return <path className={cls} d={edgePath(a, b, isBack)} markerEnd={marker} />
}
