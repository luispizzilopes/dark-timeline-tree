import { Chip } from './Chip.jsx'

export const Row = ({ label, ids, onGo }) =>
  ids.length ? (
    <div className="row"><span className="k">{label}</span><span className="v">{ids.map((i) => <Chip key={i} id={i} onGo={onGo} />)}</span></div>
  ) : null
