import { useMemo, useState } from 'react'
import { CH, PARADOX } from '../data/dataset.js'
import { buildView } from '../data/buildView.js'
import { CONSOLIDATED_VIEW } from '../data/views.js'
import { useHighlight } from './useHighlight.js'

const stamp = (id) => ({ id, n: Date.now() })

// Estado e navegação do explorador: mundo atual, seleção, foco, paradoxo ativo, busca, painel.
export function useExplorer() {
  const [viewId, setViewId] = useState('jonas_world')
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('about')
  const [focusMode, setFocusMode] = useState('none')
  const [paradoxId, setParadoxId] = useState(null)
  const [overlay, setOverlay] = useState('none')
  const [query, setQuery] = useState('')
  const [center, setCenter] = useState(null)
  const [sheet, setSheet] = useState(true)

  const view = useMemo(() => buildView(viewId), [viewId])
  const nodeIds = useMemo(() => new Set(view.nodes.map((n) => n.id)), [view])
  const consolidated = viewId === CONSOLIDATED_VIEW
  const toNode = (cid) => (consolidated ? 'cg_' + CH[cid].canonicalSlug : cid)
  const centerLater = (id, ms) => setTimeout(() => setCenter(stamp(id)), ms)

  const select = (id, { go = false } = {}) => {
    setSelected(id)
    if (id) { setTab('person'); setSheet(true); if (go) setCenter(stamp(id)) }
  }

  // Vai até um personagem, trocando de mundo se ele não está na visão atual.
  const onGo = (cid) => {
    const c = CH[cid]
    if (consolidated) return select('cg_' + c.canonicalSlug, { go: true })
    if (!nodeIds.has(cid)) { setViewId(c.worldId); setParadoxId(null); setSelected(cid); setTab('person'); centerLater(cid, 60); return }
    select(cid, { go: true })
  }

  const openVersion = (cid) => {
    setViewId(CH[cid].worldId); setParadoxId(null); setFocusMode('none'); setOverlay('none')
    setSelected(cid); setTab('person'); setSheet(true)
    centerLater(cid, 80)
  }

  const changeView = (v) => { setViewId(v); setSelected(null); setFocusMode('none'); setParadoxId(null) }

  const onParadox = (pid, charId) => {
    if (pid === null) return setParadoxId(null)
    const p = PARADOX[pid]
    setParadoxId(pid)
    setTab('paradox')
    const need = p.cyclePath ? p.cyclePath : p.participants.map((x) => x.characterId)
    if (!consolidated && !need.every((i) => nodeIds.has(i))) {
      const w = p.worldIds.find((x) => need.every((i) => CH[i].worldId === x || i === 'cw_unknown'))
      if (w) setViewId(w); else setViewId(CONSOLIDATED_VIEW)
      setSelected(null)
    }
    if (charId) setTimeout(() => select(consolidated ? 'cg_' + CH[charId].canonicalSlug : charId, { go: true }), 60)
  }

  const pickOverlay = (k) => { setOverlay(k); setParadoxId(null) }

  const { lit, litEdges } = useHighlight({ view, nodeIds, paradoxId, selected, focusMode, overlay, query, toNode })

  const selNode = selected && view.nodes.find((n) => n.id === selected)
  const dirty = !!(selected || paradoxId || focusMode !== 'none' || overlay !== 'none' || query)
  const clearAll = () => { setSelected(null); setParadoxId(null); setFocusMode('none'); setOverlay('none'); setQuery(''); setCenter(stamp(null)) }

  return {
    viewId, view, selected, selNode, tab, setTab, focusMode, setFocusMode, paradoxId, overlay, query, setQuery, center, sheet, setSheet,
    lit, litEdges, dirty, consolidated,
    select, onGo, openVersion, changeView, onParadox, pickOverlay, clearAll,
  }
}
