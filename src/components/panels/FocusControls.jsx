import { Seg } from '../common/Seg.jsx'

const FOCUS_OPTIONS = [['up', 'Ancestrais'], ['down', 'Descendentes'], ['both', 'Ambos']]

// Clicar no modo ativo desliga o destaque.
export const FocusControls = ({ focusMode, onFocus }) => (
  <Seg label="Destacar" value={focusMode} options={FOCUS_OPTIONS} onChange={(m) => onFocus(focusMode === m ? 'none' : m)} />
)
