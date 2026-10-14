export const ZoomControls = ({ onZoom, onFit }) => (
  <div className="zoom">
    <button onClick={() => onZoom(1.25)} aria-label="Aproximar">+</button>
    <button onClick={() => onZoom(0.8)} aria-label="Afastar">−</button>
    <button onClick={onFit} aria-label="Ajustar à tela">⌖</button>
  </div>
)
