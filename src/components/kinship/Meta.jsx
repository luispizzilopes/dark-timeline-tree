import { CERTAINTY_PT } from '../../domain/kinship/index.js'
import { worldsText } from './constants.js'

export function Meta({ worlds, certainty, cross }) {
  return (
    <div className="tags">
      {worlds?.length > 0 && <span className="tag">{worldsText(worlds)}</span>}
      {cross && <span className="tag">cruza mundos</span>}
      {certainty && <span className={'cert c-' + certainty}>certeza {CERTAINTY_PT[certainty] || certainty}</span>}
    </div>
  )
}
