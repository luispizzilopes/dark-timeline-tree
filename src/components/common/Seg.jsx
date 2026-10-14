// Seletor segmentado: [valor, rótulo][].
export function Seg({ label, value, options, onChange }) {
  return (
    <div className="focus">
      <span>{label}</span>
      {options.map(([v, l]) => <button key={v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  )
}
