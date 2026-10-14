import { AboutPanel } from '../panels/AboutPanel.jsx'
import { GroupPanel } from '../panels/GroupPanel.jsx'
import { ParadoxPanel } from '../panels/ParadoxPanel.jsx'
import { PersonPanel } from '../panels/PersonPanel.jsx'

const TABS = [['person', 'Personagem'], ['paradox', 'Paradoxos'], ['about', 'Mundos']]

export function SidePanel({ open, onToggle, tab, onTab, selected, selNode, focusMode, onFocus, paradoxId, onGo, onOpenVersion, onParadox }) {
  return (
    <aside className={'side ' + (open ? 'open' : '')}>
      <button className="grab" onClick={onToggle} aria-label="Painel">{open ? '▾' : '▴'}</button>
      <div className="tabs">
        {TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => onTab(k)}>{l}</button>)}
      </div>
      <div className="scroll">
        {tab === 'person' && (selNode
          ? selNode.group
            ? <GroupPanel node={selNode} onGo={onOpenVersion} />
            : <PersonPanel id={selected} onGo={onGo} onFocus={onFocus} focusMode={focusMode} onParadox={onParadox} />
          : <p className="empty">Selecione um rosto no grafo para ver família, versões no tempo e papel nos paradoxos.</p>)}
        {tab === 'paradox' && <ParadoxPanel active={paradoxId} onPick={onParadox} />}
        {tab === 'about' && <AboutPanel />}
      </div>
    </aside>
  )
}
