import { useMemo } from 'react'
import { PARADOX } from '../data/dataset.js'
import { computeHighlight } from '../domain/highlight.js'

export function useHighlight({ view, nodeIds, paradoxId, selected, focusMode, overlay, query, toNode }) {
  return useMemo(
    () => computeHighlight({ view, nodeIds, paradox: paradoxId ? PARADOX[paradoxId] : null, selected, focusMode, overlay, query, toNode }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paradoxId, selected, focusMode, overlay, query, view, nodeIds],
  )
}
