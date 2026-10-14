import { chronoInversion } from './evidence.js'
import { genderOf, nm, own, strip } from './naming.js'
import { ancestorTitle, parentTitle } from './titles.js'
import { listPt, pick, plural } from './utils.js'

// "Mikkel … torna-se Michael …": só quando o personagem é viajante, tem cadeia de identidades
// e é o "pai" de um vínculo cronologicamente invertido (é aí que a identidade nova importa).
function becomeClause(g, edge) {
  const c = g.chars.get(edge.parent)
  if (c.timeTravel?.isTimeTraveler !== true || !chronoInversion(g, edge)) return null
  const idn = (g.identities.get(edge.parent) || []).find((i) => i.kind === 'alias_chain' && i.names.length > 1)
  return idn ? idn.names.slice(1).map((n) => strip(n.label)) : null
}

// Identidades alternativas e viagens no tempo registradas para um personagem (dados, não texto fixo).
function nodeNote(g, id) {
  const c = g.chars.get(id), bits = []
  for (const i of g.identities.get(id) || []) {
    if (i.names.length < 2) continue
    const last = i.names.at(-1)
    bits.push(`identidades: ${i.names.map((x) => strip(x.label)).join(' → ')}${last.context ? ` (${last.context})` : ''}`)
  }
  if (c.timeTravel?.isTimeTraveler === true) bits.push(`viajante do tempo${c.timeTravel.notes ? ` — ${c.timeTravel.notes}` : ''}`)
  return bits.length ? { id, parts: [nm(g, id), ': ', bits.join(' · ')] } : null
}

export function narrateCycle(g, cyc) {
  const { nodes, edges, length: L } = cyc
  const A = nodes[0]
  const title = (e) => parentTitle(e.kind, genderOf(g, e.parent))
  const clause = (e) => { const b = becomeClause(g, e); return b ? [' viaja ao passado, torna-se ', listPt(b), ' e'] : [] }
  const sentence = (i) => {
    const e = edges[i], last = i === L - 1
    const lead = i === 0 ? [nm(g, A)] : [last ? ', que por sua vez' : ', que']
    return [...lead, ...clause(e), ' é ', title(e), ' ', ...(last ? own(g, A) : ['de ', nm(g, e.child)])]
  }
  let brief
  if (L <= 3) {
    brief = [...edges.flatMap((_, i) => sentence(i)), '.']
  } else {
    const B = nodes[1], Z = nodes[L - 1]
    const mid = edges.slice(1, L - 1)
    const gens = L - 2
    const ancT = mid.every((e) => e.kind === 'biological') && gens <= 3 ? ancestorTitle(gens, genderOf(g, B)) : 'ancestral'
    const e0 = edges[0], eZ = edges[L - 1]
    brief = [
      nm(g, A), ...clause(e0), ' é ', title(e0), ' de ', nm(g, B), ', que é ', ancT, ' de ', nm(g, Z), ` (${plural(gens, 'geração', 'gerações')} de distância). `,
      nm(g, Z), ', por sua vez,', ...clause(eZ), ' é ', title(eZ), ' ', ...own(g, A), '.',
    ]
  }
  const gA = genderOf(g, A)
  const self = pick(gA, 'si mesmo', 'si mesma')
  const nature = cyc.genetic ? 'caracterizando um paradoxo de bootstrap genealógico' : 'um ciclo de ancestralidade que depende de vínculo não biológico (adoção/afinidade)'
  const conclusion = [
    'Isso cria um ciclo genealógico de ', plural(L, 'geração', 'gerações'), ' em que ', nm(g, A), ' é ancestral de ', self, ', ', nature,
    cyc.genetic ? ' — a linha de descendência volta ao ponto de partida.' : '.',
    ' Na prática, ', nm(g, A), ' é ', pick(gA, 'o seu próprio ', 'a sua própria '), ancestorTitle(L, gA), '.',
  ]
  const paragraphs = [brief, conclusion]

  const context = []
  if (cyc.travelers.length)
    context.push('Viajantes do tempo no ciclo: ', ...cyc.travelers.flatMap((t, i) => [i ? ', ' : '', nm(g, t)]), '. ')
  if (cyc.inversions.length)
    context.push(`${plural(cyc.inversions.length, 'vínculo tem', 'vínculos têm')} inversão cronológica (o pai nasce depois do filho) — indício de viagem no tempo: `,
      ...cyc.inversions.flatMap(({ e, inv }, i) => [i ? '; ' : '', nm(g, e.parent), ` (${inv.parentYear}) → `, nm(g, e.child), ` (${inv.childYear})`]), '.')
  if (context.length) paragraphs.push(context)

  return { paragraphs, nodeNotes: nodes.map((n) => nodeNote(g, n)).filter(Boolean) }
}
