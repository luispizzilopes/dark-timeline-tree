import { useState } from 'react'

const LINE_TOGGLES = [
  ['parent', '', 'pai → filho (fina, com seta)'],
  ['cycle', 'amberl', 'aresta do ciclo'],
  ['partner', 'par', 'relação afetiva (tracejada, vermelha)'],
  ['spouse', 'spl', 'casamento (grossa, laranja)'],
]

export function Footer({ lines, onToggleLine, label }) {
  const [open, setOpen] = useState(false)
  return (
    <footer className={open ? 'legend-open' : ''}>
      <button type="button" className="legend-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>Legenda e linhas {open ? '▾' : '▴'}</button>
      <ul className="legend" aria-label="Legenda (clique nos tipos de linha para ocultar/mostrar)">
        <li><span className="lg amber">∞</span> paradoxo de bootstrap (membro do ciclo)</li>
        <li><span className="lg blood" /> existência depende do nó temporal</li>
        <li><span className="lg star">✦</span> permanece no Mundo de Origem</li>
        {LINE_TOGGLES.map(([k, cls, text]) => (
          <li key={k}>
            <button type="button" className={'lgbtn ' + (lines[k] ? '' : 'off')} aria-pressed={lines[k]} title="Mostrar/ocultar" onClick={() => onToggleLine(k)}>
              <span className={('lg line ' + cls).trim()} /> {text}
            </button>
          </li>
        ))}
      </ul>
      <span className="credit">{label} · dados: Dark Wiki &amp; série</span>
    </footer>
  )
}
