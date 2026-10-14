import { VIEWS } from './data/views.js'
import { Footer } from './components/layout/Footer.jsx'
import { Header } from './components/layout/Header.jsx'
import { IntroOverlay } from './components/layout/IntroOverlay.jsx'
import { SidePanel } from './components/layout/SidePanel.jsx'
import { Toolbar } from './components/layout/Toolbar.jsx'
import GraphView from './components/graph/GraphView.jsx'
import { useEscapeKey } from './hooks/useEscapeKey.js'
import { useExplorer } from './hooks/useExplorer.js'
import { useIntro } from './hooks/useIntro.js'
import { useLineVisibility } from './hooks/useLineVisibility.js'

export default function App() {
  const x = useExplorer()
  const [lines, toggleLine] = useLineVisibility()
  const intro = useIntro()
  useEscapeKey(x.clearAll)

  return (
    <div className="app">
      <IntroOverlay visible={intro} />
      <div className="fog" aria-hidden />
      <Header viewId={x.viewId} onChangeView={x.changeView} query={x.query} onQuery={x.setQuery} />
      <Toolbar count={x.view.nodes.length} consolidated={x.consolidated} overlay={x.overlay} onOverlay={x.pickOverlay} dirty={x.dirty} onClear={x.clearAll} />
      <main>
        <GraphView view={x.view} selected={x.selected} onSelect={(id) => x.select(id)} lit={x.lit} litEdges={x.litEdges} lines={lines} selectedId={x.selected} centerToken={x.center} />
        <SidePanel
          open={x.sheet} onToggle={() => x.setSheet(!x.sheet)} tab={x.tab} onTab={x.setTab}
          selected={x.selected} selNode={x.selNode} focusMode={x.focusMode} onFocus={x.setFocusMode} paradoxId={x.paradoxId}
          onGo={x.onGo} onOpenVersion={x.openVersion} onParadox={x.onParadox}
        />
      </main>
      <Footer lines={lines} onToggleLine={toggleLine} label={VIEWS.find((v) => v.id === x.viewId).label} />
    </div>
  )
}
