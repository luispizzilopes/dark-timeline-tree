export const VersionsSection = ({ versions }) => versions.length > 0 && (
  <>
    <h3>Versões no tempo</h3>
    <ul className="versions">
      {versions.map((v, i) => <li key={i}><b>{v.label}</b> {v.years && <em>{v.years}</em>}{v.ageApprox && <em> · ~{v.ageApprox} anos</em>}{v.note && <span> — {v.note}</span>}</li>)}
    </ul>
  </>
)
