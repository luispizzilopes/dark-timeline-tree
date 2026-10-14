import { Chip } from '../common/Chip.jsx'

export const CounterpartsSection = ({ counterparts, onGo }) => counterparts.length > 0 && (
  <>
    <h3>Em outros mundos</h3>
    <div className="row"><span className="v">{counterparts.map(([, i]) => <Chip key={i} id={i} onGo={onGo} />)}</span></div>
  </>
)
