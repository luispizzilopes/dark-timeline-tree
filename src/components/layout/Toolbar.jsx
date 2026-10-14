const OVERLAYS = [['none', 'Tudo'], ['cycle', '∞ Ciclos'], ['knot', '⏳ Dependem do nó'], ['survive', '✦ Sobrevivem']]

export const Toolbar = ({ count, consolidated, overlay, onOverlay, dirty, onClear }) => (
  <div className="toolbar">
    <span className="count">{count} {consolidated ? 'pessoas (todas as versões)' : 'personagens'}</span>
    {OVERLAYS.map(([k, l]) => (
      <button key={k} className={'pill ' + (overlay === k ? 'on' : '')} onClick={() => onOverlay(k)}>{l}</button>
    ))}
    <button className="pill clear" disabled={!dirty} onClick={onClear} title="Esc">✕ Limpar seleção</button>
    <span className="hint">arraste · role para zoom · clique em um rosto</span>
  </div>
)
