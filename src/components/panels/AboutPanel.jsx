import { DATA } from '../../data/dataset.js'

export function AboutPanel() {
  const m = DATA.meta
  return (
    <div className="about">
      <p className="quote">“O começo é o fim, e o fim é o começo.”</p>
      <p>{m.counts.characters} personagens · {m.counts.relationships} relações · {m.counts.paradoxes} paradoxos.</p>
      {DATA.worlds.map((w) => (
        <div key={w.id} className="box" style={{ borderColor: w.color }}>
          <b style={{ color: w.color }}>{w.name}</b>
          <p>{w.description}</p>
          <p><em>{w.status}</em></p>
        </div>
      ))}
      <h3>Fontes</h3>
      <ul className="versions">{m.sources.map((s) => <li key={s.name}><b>{s.name}</b> — {s.use}</li>)}</ul>
    </div>
  )
}
