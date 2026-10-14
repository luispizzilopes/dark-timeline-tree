import { Triquetra } from '../brand/Triquetra.jsx'

export const IntroOverlay = ({ visible }) => (
  <div className={'intro ' + (visible ? '' : 'gone')}>
    <Triquetra size={120} />
    <p>Sic mundus creatus est</p>
  </div>
)
