import { CH } from '../../data/dataset.js'
import { KinshipSection } from '../kinship/KinshipSection.jsx'
import { CounterpartsSection } from './CounterpartsSection.jsx'
import { FamilySection } from './FamilySection.jsx'
import { FocusControls } from './FocusControls.jsx'
import { IdentitiesSection } from './IdentitiesSection.jsx'
import { PersonHeader } from './PersonHeader.jsx'
import { TimeSection } from './TimeSection.jsx'
import { VersionsSection } from './VersionsSection.jsx'

export function PersonPanel({ id, onGo, onFocus, focusMode, onParadox }) {
  const c = CH[id]
  return (
    <div className="person">
      <PersonHeader c={c} />
      <FocusControls focusMode={focusMode} onFocus={onFocus} />
      <FamilySection c={c} onGo={onGo} />
      <KinshipSection id={id} onGo={onGo} onParadox={onParadox} />
      <TimeSection c={c} onGo={onGo} onParadox={onParadox} />
      <VersionsSection versions={c.temporalVersions} />
      <IdentitiesSection ids={c.identities} />
      <CounterpartsSection counterparts={Object.entries(c.counterparts)} onGo={onGo} />
      {c.notes && <p className="note">{c.notes}</p>}
    </div>
  )
}
