import { DATA } from '../../data/dataset.js'

export const IdentitiesSection = ({ ids }) => ids.length > 0 && (
  <>
    <h3>Identidades</h3>
    {ids.map((iid) => {
      const idn = DATA.identities.find((x) => x.id === iid)
      return <div key={iid} className="box"><ul className="versions">{idn.names.map((n, i) => <li key={i}><b>{n.label}</b>{n.context && <span> — {n.context}</span>}</li>)}</ul>{idn.note && <p>{idn.note}</p>}</div>
    })}
  </>
)
