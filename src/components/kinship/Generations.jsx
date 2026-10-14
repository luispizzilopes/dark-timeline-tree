import { genLabel } from './constants.js'
import { KinChip } from './KinChip.jsx'

export function Generations({ title, groups, labels, fallback, subject, onGo }) {
  if (!groups.length) return null
  return (
    <>
      <h4 className="kh">{title}</h4>
      {groups.map((gr) => (
        <div className="row" key={gr.generation}>
          <span className="k">{genLabel(labels, gr.generation, fallback)}</span>
          <span className="v">{gr.items.map((it) => <KinChip key={it.id} item={it} subject={subject} onGo={onGo} />)}</span>
        </div>
      ))}
    </>
  )
}
