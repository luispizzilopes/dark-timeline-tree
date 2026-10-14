import { useMemo, useState } from 'react'
import { KG } from '../../data/dataset.js'
import { analyze, findCycles, withMinCertainty } from '../../domain/kinship/index.js'
import { Seg } from '../common/Seg.jsx'
import { ANC_LABEL, CERTAINTY_OPTIONS, DEPTHS, DESC_LABEL } from './constants.js'
import { CrossWorldSection } from './CrossWorldSection.jsx'
import { CycleCard } from './CycleCard.jsx'
import { Generations } from './Generations.jsx'
import { Parts } from './Parts.jsx'
import { RelateTool } from './RelateTool.jsx'
import { UnusualRelations } from './UnusualRelations.jsx'

export function KinshipSection({ id, onGo, onParadox }) {
  const [depth, setDepth] = useState(4)
  const [mode, setMode] = useState('brief')
  const [minRank, setMinRank] = useState(-1)
  const graph = useMemo(() => withMinCertainty(KG, minRank), [minRank])
  const a = useMemo(() => analyze(graph, id, { depth }), [graph, id, depth])
  const hidden = useMemo(() => (minRank < 0 ? 0 : findCycles(KG, id).length - findCycles(graph, id).length), [graph, id, minRank])
  if (!a) return null
  const detail = mode === 'detail'
  return (
    <section className="kin">
      <h3>Análise de parentesco</h3>
      <Seg label="Texto" value={mode} onChange={setMode} options={[['brief', 'Resumo'], ['detail', 'Detalhado']]} />
      <Seg label="Gerações" value={depth} onChange={setDepth} options={DEPTHS.map((d) => [d, String(d)])} />
      <Seg label="Certeza" value={minRank} onChange={setMinRank} options={CERTAINTY_OPTIONS} />
      <p className="kin-summary"><Parts parts={a.summary} onGo={onGo} /></p>

      {hidden > 0 && <p className="note">{hidden === 1 ? '1 ciclo genealógico depende' : `${hidden} ciclos genealógicos dependem`} de vínculos com certeza abaixo do filtro e {hidden === 1 ? 'foi ocultado' : 'foram ocultados'}.</p>}
      {a.cycles.length > 0 && (
        <>
          <h4 className="kh">Paradoxos genealógicos</h4>
          {a.cycles.map((c) => <CycleCard key={c.id} c={c} detail={detail} onGo={onGo} onParadox={onParadox} />)}
        </>
      )}

      <UnusualRelations items={a.unusual} detail={detail} onGo={onGo} />
      <Generations title="Ancestrais" groups={a.ancestors} labels={ANC_LABEL} fallback="Ancestrais" subject={id} onGo={onGo} />
      <Generations title="Descendentes" groups={a.descendants} labels={DESC_LABEL} fallback="Descendentes" subject={id} onGo={onGo} />
      <CrossWorldSection crossWorld={a.crossWorld} counterparts={a.counterparts} detail={detail} onGo={onGo} />
      <RelateTool key={id} id={id} graph={graph} onGo={onGo} />
    </section>
  )
}
