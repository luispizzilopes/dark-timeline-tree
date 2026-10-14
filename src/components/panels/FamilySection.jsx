import { Chip } from '../common/Chip.jsx'
import { Row } from '../common/Row.jsx'

export function FamilySection({ c, onGo }) {
  return (
    <>
      <h3>Família</h3>
      <Row label="Pais biológicos" ids={c.parents.biological} onGo={onGo} />
      <Row label="Pais adotivos" ids={c.parents.adoptive} onGo={onGo} />
      <Row label="Pais (natureza incerta)" ids={c.parents.unknownNature} onGo={onGo} />
      <Row label="Filhos" ids={c.children.biological} onGo={onGo} />
      <Row label="Filhos adotivos" ids={c.children.adoptive} onGo={onGo} />
      <Row label="Irmãos" ids={c.siblings.full} onGo={onGo} />
      <Row label="Meio-irmãos" ids={c.siblings.half} onGo={onGo} />
      <Row label="Irmãos (outros)" ids={[...c.siblings.step, ...c.siblings.unspecified]} onGo={onGo} />
      {c.partners.length > 0 && (
        <div className="row"><span className="k">Cônjuges / parceiros</span>
          <span className="v">{c.partners.map((p) => (
            <span key={p.relationshipId} className="pp"><Chip id={p.personId} onGo={onGo} /><small>{(p.kind || p.status || '').replace(/_/g, ' ')}</small></span>
          ))}</span></div>
      )}
    </>
  )
}
