// Motor de parentesco e paradoxos genealógicos.
//
// Orientado a grafos e 100% dirigido pelos dados: a única fonte de verdade é
// `raw.relationships` (com `characters`, `identities`, `worlds` e `paradoxes` usados
// só para rotular e associar). Nenhuma regra menciona personagem específico, então
// novos personagens/relações no JSON passam a ser analisados sem mudar este arquivo.
//
// Todo texto gerado é uma lista de "partes": strings e { id, text } (referência a um
// personagem). Isso permite renderizar nomes clicáveis e também achatar para texto puro.

export const ANCESTRY_KINDS = ['biological', 'adoptive'] // quem conta como linhagem
export const BIOLOGICAL = ['biological']

export const CERTAINTY_RANK = { confirmed: 3, high: 2, medium: 1, low: 0 }
export const CERTAINTY_PT = { confirmed: 'confirmada', high: 'alta', medium: 'média', low: 'baixa' }
export const EVIDENCE_PT = {
  series: 'série',
  'series+wiki': 'série + Wiki',
  dark_wiki: 'Dark Wiki',
  derived_from_parent_child: 'derivado dos vínculos pai-filho',
}
export const PARENT_KIND_PT = { biological: 'biológico', adoptive: 'adotivo', step: 'por afinidade', unknown_nature: 'natureza incerta' }

const MAX_EXPANSIONS = 200000 // trava de segurança contra explosão combinatória

// ───────────────────────────── construção do grafo ─────────────────────────────

export function buildKinshipGraph(raw) {
  const chars = new Map(raw.characters.map((c) => [c.id, c]))
  const worlds = new Map(raw.worlds.map((w) => [w.id, w]))
  const g = {
    raw, chars, worlds,
    up: new Map(), down: new Map(), // id -> arestas pai→filho
    spouses: new Map(), partners: new Map(), siblingRels: new Map(), derivedRels: new Map(),
    identities: new Map(), sccCache: new Map(),
  }
  const push = (m, k, v) => { if (!m.has(k)) m.set(k, []); m.get(k).push(v) }
  for (const r of raw.relationships) {
    if (r.type === 'parent_child') {
      if (!chars.has(r.parentId) || !chars.has(r.childId)) continue
      const e = { rel: r, parent: r.parentId, child: r.childId, kind: r.kind }
      push(g.down, r.parentId, e)
      push(g.up, r.childId, e)
    } else if (r.memberIds && r.memberIds.every((m) => chars.has(m))) {
      const [a, b] = r.memberIds
      const target = { spouse: g.spouses, partner: g.partners, sibling: g.siblingRels, derived_kinship: g.derivedRels }[r.type]
      if (!target) continue
      push(target, a, { rel: r, other: b })
      push(target, b, { rel: r, other: a })
    }
  }
  for (const idn of raw.identities || []) push(g.identities, idn.characterId, idn)
  return g
}

// Visão do grafo só com vínculos de certeza >= minRank (3 confirmada, 2 alta, 1 média, 0 baixa).
// Tudo (travessia, ciclos, parentescos) passa a respeitar o corte, sem mudar a lógica.
export function withMinCertainty(g, minRank) {
  if (minRank < 0) return g
  const keep = (rel) => (CERTAINTY_RANK[rel.certainty] ?? -1) >= minRank
  const filtered = (m) => new Map([...m].map(([k, list]) => [k, list.filter((x) => keep(x.rel))]))
  return { ...g, up: filtered(g.up), down: filtered(g.down), spouses: filtered(g.spouses), partners: filtered(g.partners), siblingRels: filtered(g.siblingRels), derivedRels: filtered(g.derivedRels), sccCache: new Map() }
}

// ───────────────────────────── nomes, gênero e rótulos ─────────────────────────────

const strip = (s) => s.replace(/\s*\(.*?\)\s*/g, ' ').trim()
export const displayName = (g, id) => {
  const c = g.chars.get(id)
  return c ? strip(c.name).split(' / ')[0].trim() : id
}
const genderOf = (g, id) => g.chars.get(id)?.gender
const pick = (gender, m, f, u = m) => (gender === 'female' ? f : gender === 'male' ? m : u)
// Homônimos de mundos diferentes (versões equivalentes) ganham o mundo entre parênteses quando
// aparecem fora do mundo de contexto — sem isso "Tronte Nielsen" seria ambíguo.
function ambiguousNames(g) {
  if (!g.nameWorlds) {
    g.nameWorlds = new Map()
    for (const c of g.chars.values()) {
      const k = displayName(g, c.id)
      if (!g.nameWorlds.has(k)) g.nameWorlds.set(k, new Set())
      g.nameWorlds.get(k).add(c.worldId)
    }
  }
  return g.nameWorlds
}
const nm = (g, id, ctx) => {
  const c = g.chars.get(id), text = displayName(g, id)
  if (c && ctx && c.worldId !== ctx && ambiguousNames(g).get(text)?.size > 1) return { id, text: `${text} (${worldName(g, c.worldId)})` }
  return { id, text }
}
const worldName = (g, wid) => g.worlds.get(wid)?.name || wid
export const worldList = (g, ids) => {
  const n = ids.map((w) => worldName(g, w))
  return n.length > 1 ? `${n.slice(0, -1).join(', ')} e ${n.at(-1)}` : n[0] || ''
}
const uniq = (a) => [...new Set(a)]
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`

const ANC = [null, ['pai', 'mãe', 'genitor'], ['avô', 'avó'], ['bisavô', 'bisavó'], ['trisavô', 'trisavó'], ['tetravô', 'tetravó'], ['pentavô', 'pentavó']]
const DESC = [null, ['filho', 'filha'], ['neto', 'neta'], ['bisneto', 'bisneta'], ['trineto', 'trineta'], ['tetraneto', 'tetraneta'], ['pentaneto', 'pentaneta']]
export const ancestorTitle = (n, gender) => (ANC[n] ? pick(gender, ANC[n][0], ANC[n][1], ANC[n][2]) : `ancestral de ${n}ª geração`)
// "bisavô (3 gerações)" — o rótulo numérico (>6) já traz o número.
const withGens = (title, n) => (n > 1 && n <= 6 ? `${title} (${n} gerações)` : title)
export const descendantTitle = (n, gender) => (DESC[n] ? pick(gender, DESC[n][0], DESC[n][1]) : `descendente de ${n}ª geração`)

const parentTitle = (kind, gender) => {
  if (kind === 'adoptive') return pick(gender, 'pai adotivo', 'mãe adotiva')
  if (kind === 'step') return pick(gender, 'padrasto', 'madrasta')
  if (kind === 'unknown_nature') return 'responsável (vínculo de natureza incerta)'
  return pick(gender, 'pai', 'mãe', 'genitor')
}
const childTitle = (kind, gender) => {
  if (kind === 'adoptive') return pick(gender, 'filho adotivo', 'filha adotiva')
  if (kind === 'step') return pick(gender, 'enteado', 'enteada')
  if (kind === 'unknown_nature') return 'dependente (vínculo de natureza incerta)'
  return pick(gender, 'filho', 'filha')
}
const own = (g, id) => [pick(genderOf(g, id), 'do próprio ', 'da própria '), nm(g, id)]
const SIB_KIND_PT = { full: ['irmão', 'irmã'], half: ['meio-irmão', 'meia-irmã'], step: ['irmão por afinidade', 'irmã por afinidade'], unspecified_parents: ['irmão (pais não especificados)', 'irmã (pais não especificados)'] }
const siblingTitle = (kind, gender) => { const t = SIB_KIND_PT[kind] || SIB_KIND_PT.full; return pick(gender, t[0], t[1]) }
const DERIVED_PT = { aunt_nephew: 'tia/tio e sobrinho(a)', half_first_cousins: 'meio-primos de 1º grau', ancestor_and_spouse: 'ancestral e cônjuge' }

export const partsToText = (parts) => parts.flat(Infinity).map((p) => (typeof p === 'string' ? p : p.text)).join('')
const yearOf = (s) => { const m = /\d{4}/.exec(s || ''); return m ? +m[0] : null }

// ───────────────────────────── arestas: mundos, certeza, rastro ─────────────────────────────

function edgeWorlds(g, rel, ids) {
  if (rel.worldId && rel.worldId !== 'cross_world' && g.worlds.has(rel.worldId)) return [rel.worldId]
  return uniq(ids.map((i) => g.chars.get(i)?.worldId).filter(Boolean))
}
const weakest = (rels) => {
  const ranks = rels.map((r) => CERTAINTY_RANK[r.certainty]).filter((x) => x !== undefined)
  if (!ranks.length) return null
  const min = Math.min(...ranks)
  return Object.keys(CERTAINTY_RANK).find((k) => CERTAINTY_RANK[k] === min)
}

// Indício de viagem no tempo: o "pai" nasceu depois do "filho".
function chronoInversion(g, e) {
  const p = yearOf(g.chars.get(e.parent)?.birth), c = yearOf(g.chars.get(e.child)?.birth)
  return p !== null && c !== null && p > c ? { parentYear: p, childYear: c } : null
}

// Passo verificável: "X é pai de Y" + metadados do vínculo que o originou.
function stepOf(g, e, ctx) {
  return {
    relId: e.rel.id,
    parts: [nm(g, e.parent, ctx), ' é ', parentTitle(e.kind, genderOf(g, e.parent)), ' de ', nm(g, e.child, ctx)],
    kind: e.kind,
    kindLabel: PARENT_KIND_PT[e.kind] || e.kind,
    worlds: edgeWorlds(g, e.rel, [e.parent, e.child]),
    crossWorld: e.rel.worldId === 'cross_world',
    certainty: e.rel.certainty,
    evidence: EVIDENCE_PT[e.rel.evidence] || e.rel.evidence,
    note: e.rel.note || null,
    chrono: chronoInversion(g, e),
  }
}
// Rastro sempre em ordem "de cima para baixo" (ancestral → descendente).
const traceSteps = (g, edges, ctx) => edges.map((e) => stepOf(g, e, ctx))

// ───────────────────────────── travessia recursiva (com prevenção de loops) ─────────────────────────────

// Enumera caminhos SIMPLES (sem repetir personagem) a partir de `start`, subindo (pais) ou
// descendo (filhos). `onPath` impede loops; quando o caminho volta a `start`, o ciclo é
// registrado em `selfHits` e a ramificação é interrompida.
function walk(g, start, dir, { kinds = ANCESTRY_KINDS, maxDepth = 4, allow = null } = {}) {
  const found = new Map(), selfHits = []
  const onPath = new Set([start])
  let budget = MAX_EXPANSIONS
  const rec = (id, depth, trace) => {
    if (depth >= maxDepth) return
    for (const e of (dir === 'up' ? g.up : g.down).get(id) || []) {
      if (!kinds.includes(e.kind) || --budget < 0) continue
      const nxt = dir === 'up' ? e.parent : e.child
      if (allow && !allow.has(nxt)) continue
      const t = [...trace, e]
      if (nxt === start) { selfHits.push(t); continue }
      if (onPath.has(nxt)) continue
      if (!found.has(nxt)) found.set(nxt, [])
      found.get(nxt).push({ depth: depth + 1, trace: t })
      onPath.add(nxt)
      rec(nxt, depth + 1, t)
      onPath.delete(nxt)
    }
  }
  rec(start, 0, [])
  return { found, selfHits }
}

const reached = (found) =>
  [...found].map(([id, paths]) => {
    paths.sort((a, b) => a.depth - b.depth)
    return { id, depth: paths[0].depth, paths, depths: uniq(paths.map((p) => p.depth)) }
  }).sort((a, b) => a.depth - b.depth)

// Componentes fortemente conexos (Tarjan): só quem está num SCC com >1 nó (ou laço) pode estar num ciclo.
function sccs(g, kinds) {
  const key = kinds.join('|')
  if (g.sccCache.has(key)) return g.sccCache.get(key)
  let idx = 0
  const index = new Map(), low = new Map(), onStack = new Set(), stack = [], comp = new Map()
  const strong = (v) => {
    index.set(v, idx); low.set(v, idx++); stack.push(v); onStack.add(v)
    for (const e of g.down.get(v) || []) {
      if (!kinds.includes(e.kind)) continue
      const w = e.child
      if (!index.has(w)) { strong(w); low.set(v, Math.min(low.get(v), low.get(w))) }
      else if (onStack.has(w)) low.set(v, Math.min(low.get(v), index.get(w)))
    }
    if (low.get(v) === index.get(v)) {
      const members = []
      let w
      do { w = stack.pop(); onStack.delete(w); members.push(w) } while (w !== v)
      const cyc = members.length > 1 || (g.down.get(v) || []).some((e) => kinds.includes(e.kind) && e.child === v)
      members.forEach((m) => comp.set(m, cyc ? new Set(members) : null))
    }
  }
  for (const id of g.chars.keys()) if (!index.has(id)) strong(id)
  g.sccCache.set(key, comp)
  return comp
}

export const isInCycle = (g, id, kinds = ANCESTRY_KINDS) => !!sccs(g, kinds).get(id)

// Todos os ciclos simples (A → … → A) que passam por `id`, do menor para o maior.
export function findCycles(g, id, { kinds = ANCESTRY_KINDS, maxLen = 14 } = {}) {
  const comp = sccs(g, kinds).get(id)
  if (!comp) return []
  const { selfHits } = walk(g, id, 'down', { kinds, maxDepth: maxLen, allow: comp })
  const seen = new Set()
  return selfHits
    .filter((t) => { const k = t.map((e) => e.rel.id).join('>'); return !seen.has(k) && seen.add(k) })
    .sort((a, b) => a.length - b.length || a.map((e) => e.rel.id).join().localeCompare(b.map((e) => e.rel.id).join()))
    .map((edges) => describeCycle(g, edges))
}

// ───────────────────────────── ciclos e narrativa ─────────────────────────────

function describeCycle(g, edges) {
  const nodes = edges.map((e) => e.parent)
  const rels = edges.map((e) => e.rel)
  const relSet = new Set(rels.map((r) => r.id))
  const paradox = (g.raw.paradoxes || []).find((p) => p.relationshipIds && p.relationshipIds.length === relSet.size && p.relationshipIds.every((i) => relSet.has(i)))
  const cyc = {
    id: edges.map((e) => e.rel.id).join('>'),
    nodes, edges,
    length: edges.length,
    genetic: edges.every((e) => e.kind === 'biological'),
    worlds: uniq([...edges.flatMap((e) => edgeWorlds(g, e.rel, [e.parent, e.child])), ...nodes.map((n) => g.chars.get(n).worldId)]),
    certainty: weakest(rels),
    paradox: paradox ? { id: paradox.id, name: paradox.name } : null,
    travelers: nodes.filter((n) => g.chars.get(n).timeTravel?.isTimeTraveler === true),
    inversions: edges.map((e) => ({ e, inv: chronoInversion(g, e) })).filter((x) => x.inv),
  }
  cyc.steps = traceSteps(g, edges)
  cyc.narrative = narrateCycle(g, cyc)
  return cyc
}

// "Mikkel … torna-se Michael …": só quando o personagem é viajante, tem cadeia de identidades
// e é o "pai" de um vínculo cronologicamente invertido (é aí que a identidade nova importa).
function becomeClause(g, edge) {
  const c = g.chars.get(edge.parent)
  if (c.timeTravel?.isTimeTraveler !== true || !chronoInversion(g, edge)) return null
  const idn = (g.identities.get(edge.parent) || []).find((i) => i.kind === 'alias_chain' && i.names.length > 1)
  return idn ? idn.names.slice(1).map((n) => strip(n.label)) : null
}
const listPt = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} e ${a.at(-1)}` : a[0])

function narrateCycle(g, cyc) {
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

// ───────────────────────────── parentesco direto ─────────────────────────────

export function directKin(g, id) {
  const parents = (g.up.get(id) || []).map((e) => ({ id: e.parent, kind: e.kind, rel: e.rel }))
  const children = (g.down.get(id) || []).map((e) => ({ id: e.child, kind: e.kind, rel: e.rel }))
  const bind = (m) => (m.get(id) || []).map((x) => ({ id: x.other, kind: x.rel.kind || x.rel.status, rel: x.rel }))
  // irmãos: os registrados + os derivados de pais em comum (cobre personagens novos sem linha de irmandade)
  const sib = new Map()
  ;(g.siblingRels.get(id) || []).forEach((x) => sib.set(x.other, { id: x.other, kind: x.rel.kind, rel: x.rel, derived: !!x.rel.derived }))
  const myParents = parents.filter((p) => ANCESTRY_KINDS.includes(p.kind)).map((p) => p.id)
  for (const p of myParents)
    for (const e of g.down.get(p) || []) {
      if (e.child === id || !ANCESTRY_KINDS.includes(e.kind) || sib.has(e.child)) continue
      const other = (g.up.get(e.child) || []).filter((x) => ANCESTRY_KINDS.includes(x.kind)).map((x) => x.parent)
      const shared = myParents.filter((q) => other.includes(q)).length
      sib.set(e.child, { id: e.child, kind: shared >= 2 ? 'full' : 'half', rel: e.rel, derived: true })
    }
  return { parents, children, spouses: bind(g.spouses), partners: bind(g.partners), siblings: [...sib.values()] }
}

// ───────────────────────────── relação entre duas pessoas ─────────────────────────────

function collateralTitle(da, db, commonCount, gender) {
  // da/db: gerações de A e de B até o ancestral comum; devolve o título de B em relação a A.
  const m = Math.min(da, db), diff = Math.abs(da - db)
  const half = commonCount < 2
  if (m === 1 && diff === 0) return siblingTitle(half ? 'half' : 'full', gender)
  if (m === 1)
    return db < da
      ? pick(gender, 'tio', 'tia') + (diff === 1 ? '' : `-${ancestorTitle(diff, gender)}`)
      : pick(gender, 'sobrinho', 'sobrinha') + (diff === 1 ? '' : `-${descendantTitle(diff, gender)}`)
  const cousin = `${half ? pick(gender, 'meio-primo', 'meia-prima') : pick(gender, 'primo', 'prima')} de ${m - 1}º grau`
  return diff ? `${cousin} (${plural(diff, 'geração', 'gerações')} ${db < da ? 'acima' : 'abaixo'})` : cousin
}

// Uma aresta cruza mundos quando o dado a marca assim ou quando as pontas moram em mundos diferentes.
const crosses = (g, e) => e.rel.worldId === 'cross_world' || g.chars.get(e.parent).worldId !== g.chars.get(e.child).worldId

// Achado de linha direta (ancestral/descendente) a partir de caminhos já enumerados.
function lineFinding(g, a, b, kind, paths) {
  paths.sort((x, y) => x.depth - y.depth)
  const best = paths[0]
  const edges = kind === 'ancestor' ? [...best.trace].reverse() : best.trace
  const gb = genderOf(g, b), ca = g.chars.get(a).worldId
  return {
    type: kind, generations: best.depth, steps: traceSteps(g, edges, ca), certainty: weakest(edges.map((e) => e.rel)),
    worlds: uniq(edges.flatMap((e) => edgeWorlds(g, e.rel, [e.parent, e.child]))), crossWorld: edges.some((e) => crosses(g, e)),
    parts: [nm(g, b, ca), ' é ', withGens(kind === 'ancestor' ? ancestorTitle(best.depth, gb) : descendantTitle(best.depth, gb), best.depth), ' de ', nm(g, a),
      paths.length === 2 ? '; há outro caminho registrado' : paths.length > 2 ? `; há outros ${paths.length - 1} caminhos registrados` : '', '.'],
  }
}

export function relate(g, a, b, { maxDepth = 10 } = {}) {
  const out = { a, b, findings: [], summary: [] }
  if (!g.chars.has(a) || !g.chars.has(b)) return out
  const ca = g.chars.get(a), cb = g.chars.get(b)
  const B = nm(g, b, ca.worldId)
  const add = (f) => out.findings.push({ crossWorld: false, ...f, worlds: f.worlds || uniq([ca.worldId, cb.worldId]) })
  if (a === b) { add({ type: 'identity', parts: [nm(g, a), ' é a própria pessoa selecionada.'] }); return out }
  if (ca.canonicalSlug && ca.canonicalSlug === cb.canonicalSlug)
    add({ type: 'counterpart', parts: [nm(g, a), ` (${worldName(g, ca.worldId)}) e `, nm(g, b), ` (${worldName(g, cb.worldId)}) são versões equivalentes em mundos diferentes: NÃO são a mesma pessoa e o vínculo entre elas não é de parentesco.`] })

  const up = walk(g, a, 'up', { maxDepth }), down = walk(g, a, 'down', { maxDepth })
  const anc = up.found.get(b), des = down.found.get(b)
  if (anc) add(lineFinding(g, a, b, 'ancestor', anc))
  if (des) add(lineFinding(g, a, b, 'descendant', des))
  if (anc && des) add({ type: 'mutual', parts: [nm(g, a), ' e ', B, ' são ancestrais um do outro: o vínculo forma um ciclo genealógico (paradoxo de bootstrap).'] })

  const kin = directKin(g, a)
  kin.siblings.filter((s) => s.id === b).forEach((s) => add({ type: 'sibling', parts: [B, ' é ', siblingTitle(s.kind, cb.gender), ' de ', nm(g, a), '.'], certainty: s.rel.certainty, worlds: edgeWorlds(g, s.rel, [a, b]) }))
  kin.spouses.filter((s) => s.id === b).forEach((s) => add({ type: 'spouse', parts: [B, ' é ', 'cônjuge', ' de ', nm(g, a), s.kind ? ` (${s.kind.replace(/_/g, ' ')})` : '', '.'], certainty: s.rel.certainty, worlds: edgeWorlds(g, s.rel, [a, b]), crossWorld: s.rel.worldId === 'cross_world' }))
  kin.partners.filter((s) => s.id === b).forEach((s) => add({ type: 'partner', parts: [nm(g, a), ' e ', B, ` têm uma relação afetiva (${(s.kind || '').replace(/_/g, ' ')}).`], certainty: s.rel.certainty, worlds: edgeWorlds(g, s.rel, [a, b]), crossWorld: s.rel.worldId === 'cross_world' }))
  ;(g.derivedRels.get(a) || []).filter((d) => d.other === b).forEach((d) =>
    add({ type: 'registered', parts: [nm(g, a), ' e ', B, ` — parentesco registrado: ${DERIVED_PT[d.rel.kind] || d.rel.kind.replace(/_/g, ' ')}. `, d.rel.note || ''], certainty: d.rel.certainty, worlds: edgeWorlds(g, d.rel, [a, b]) }))

  // colateral: ancestral comum mais próximo cujos caminhos até A e B só se encontram nele
  // (descarta falsos "tios" quando um é ancestral do outro dentro de um ciclo)
  const upB = walk(g, b, 'up', { maxDepth })
  let best = null
  for (const [id, pas] of up.found) {
    const pbs = upB.found.get(id)
    if (!pbs) continue
    for (const x of pas) for (const y of pbs) {
      const nodesX = new Set(x.trace.flatMap((e) => [e.parent, e.child])), nodesY = new Set(y.trace.flatMap((e) => [e.parent, e.child]))
      nodesX.delete(id); nodesY.delete(id)
      if ([...nodesX].some((n) => nodesY.has(n)) || nodesX.has(b) || nodesY.has(a)) continue
      const near = Math.min(x.depth, y.depth) === 1 ? Math.abs(x.depth - y.depth) <= 2 : Math.min(x.depth, y.depth) <= 3 && Math.abs(x.depth - y.depth) <= 1
      if (!near) continue
      const sum = x.depth + y.depth
      if (!best || sum < best.sum) best = { sum, items: [{ id, x, y }] }
      else if (sum === best.sum && !best.items.some((it) => it.id === id)) best.items.push({ id, x, y })
    }
  }
  if (best && !(best.items[0].x.depth === 1 && best.items[0].y.depth === 1 && out.findings.some((f) => f.type === 'sibling'))) {
    const { x, y } = best.items[0]
    const edgesA = [...x.trace].reverse(), edgesB = [...y.trace].reverse()
    add({
      type: 'collateral', degree: [x.depth, y.depth], certainty: weakest([...edgesA, ...edgesB].map((e) => e.rel)),
      steps: [...traceSteps(g, edgesA, ca.worldId), ...traceSteps(g, edgesB, ca.worldId)],
      worlds: uniq([...edgesA, ...edgesB].flatMap((e) => edgeWorlds(g, e.rel, [e.parent, e.child]))), crossWorld: [...edgesA, ...edgesB].some((e) => crosses(g, e)),
      parts: [nm(g, b, ca.worldId), ' é ', collateralTitle(x.depth, y.depth, best.items.length, cb.gender), ' de ', nm(g, a), ', com ', ...best.items.flatMap((it, i) => [i ? ' e ' : '', nm(g, it.id, ca.worldId)]), ` como ancestral comum mais próximo (${x.depth} e ${y.depth} gerações).`],
    })
  }
  out.summary = out.findings.length ? out.findings[0].parts : ['Nenhum vínculo de parentesco registrado entre ', nm(g, a), ' e ', nm(g, b), ` em até ${maxDepth} gerações.`]
  out.crossWorld = ca.worldId !== cb.worldId || out.findings.some((f) => f.crossWorld)
  return out
}

// ───────────────────────────── relações incomuns ─────────────────────────────

function unusualRelations(g, id, depth) {
  const out = []
  const c = g.chars.get(id)
  const kin = directKin(g, id)
  const handled = new Set()

  // parceiros que são ancestrais/descendentes ou consanguíneos
  for (const p of [...kin.spouses, ...kin.partners]) {
    if (handled.has(p.id)) continue
    handled.add(p.id)
    const r = relate(g, id, p.id, { maxDepth: Math.max(depth, 6) })
    const rel = r.findings.filter((x) => ['ancestor', 'descendant', 'collateral', 'sibling'].includes(x.type))
    if (!rel.length) continue
    const reg = r.findings.find((x) => x.type === 'registered')
    out.push({
      type: 'partner_kin', other: p.id, worlds: uniq(rel.flatMap((f) => f.worlds)), crossWorld: rel.some((f) => f.crossWorld), certainty: weakest([p.rel, ...rel.map((f) => ({ certainty: f.certainty }))]),
      parts: [nm(g, id), ' e ', nm(g, p.id, c.worldId), ' têm uma relação afetiva, mas também são parentes: ', ...rel.flatMap((f, i) => [i ? ' E ainda: ' : '', ...f.parts])],
      traces: rel.map((f) => ({ parts: f.parts, steps: f.steps || [] })),
      registered: reg ? reg.parts : null,
    })
  }
  // parentescos derivados registrados nos dados e ainda não cobertos
  for (const d of g.derivedRels.get(id) || []) {
    if (handled.has(d.other)) continue
    out.push({
      type: 'registered', other: d.other, worlds: edgeWorlds(g, d.rel, [id, d.other]), certainty: d.rel.certainty, traces: [],
      parts: [nm(g, id), ' e ', nm(g, d.other, c.worldId), ` — ${DERIVED_PT[d.rel.kind] || d.rel.kind.replace(/_/g, ' ')}. `, d.rel.note || ''],
    })
  }
  // ancestral por mais de uma geração (colapso de linhagem)
  const up = walk(g, id, 'up', { maxDepth: Math.max(depth, 8) })
  for (const r of reached(up.found)) {
    if (r.depths.length < 2) continue
    const shallow = r.paths.find((p) => p.depth === r.depths[0]), deep = r.paths.find((p) => p.depth === r.depths.at(-1))
    const gd = genderOf(g, r.id)
    out.push({
      type: 'multi_generation', other: r.id, certainty: weakest([...shallow.trace, ...deep.trace].map((e) => e.rel)),
      worlds: uniq([...shallow.trace, ...deep.trace].flatMap((e) => edgeWorlds(g, e.rel, [e.parent, e.child]))),
      parts: [nm(g, r.id, c.worldId), ' é, ao mesmo tempo, ', withGens(ancestorTitle(r.depths[0], gd), r.depths[0]), r.depths[0] === 1 ? ' (1 geração)' : '', ' e ', withGens(ancestorTitle(r.depths.at(-1), gd), r.depths.at(-1)), ' de ', nm(g, id), ' — a mesma pessoa aparece em duas gerações da linhagem.'],
      traces: [{ parts: ['Caminho mais curto'], steps: traceSteps(g, [...shallow.trace].reverse(), c.worldId) }, { parts: ['Caminho mais longo'], steps: traceSteps(g, [...deep.trace].reverse(), c.worldId) }],
    })
  }
  return out
}

// ───────────────────────────── análise completa de um personagem ─────────────────────────────

// Agrupa por geração; `dir` diz se a travessia subiu ('up') ou desceu ('down') para montar o caminho citável.
const groupByGeneration = (g, list, title, dir) => {
  const by = new Map()
  list.forEach((r) => {
    const best = r.paths[0]
    const item = {
      id: r.id, generation: r.depth, title: title(r.depth, genderOf(g, r.id)), pathCount: r.paths.length,
      nonBiological: best.trace.some((e) => e.kind !== 'biological'),
      cross: best.trace.some((e) => crosses(g, e)),
      via: best.trace.map((e) => (dir === 'up' ? e.parent : e.child)),
    }
    if (!by.has(r.depth)) by.set(r.depth, [])
    by.get(r.depth).push(item)
  })
  return [...by].sort((x, y) => x[0] - y[0]).map(([generation, items]) => ({ generation, items }))
}

// "é filho de A e B, adotado por C" — separa biológicos de adoção/afinidade.
function parentsSentence(g, c, parents) {
  const names = (list) => list.flatMap((p, i) => [i ? (i === list.length - 1 ? ' e ' : ', ') : '', nm(g, p.id)])
  const by = (k) => parents.filter((p) => p.kind === k)
  const bio = by('biological'), ado = by('adoptive'), step = by('step'), unk = by('unknown_nature')
  const bits = []
  if (bio.length) bits.push([pick(c.gender, 'filho', 'filha'), ' de ', ...names(bio)])
  if (ado.length) bits.push([pick(c.gender, 'adotado', 'adotada'), ' por ', ...names(ado)])
  if (step.length) bits.push([pick(c.gender, 'enteado', 'enteada'), ' de ', ...names(step)])
  if (unk.length) bits.push(['criado(a) por ', ...names(unk), ' (vínculo de natureza incerta)'])
  if (!bits.length) return [' não tem pais registrados']
  return [' é ', ...bits.flatMap((b, i) => [i ? ', ' : '', ...b])]
}

export function analyze(g, id, { depth = 4 } = {}) {
  const c = g.chars.get(id)
  if (!c) return null
  const direct = directKin(g, id)
  const up = walk(g, id, 'up', { maxDepth: depth }), down = walk(g, id, 'down', { maxDepth: depth })
  const ancestors = reached(up.found), descendants = reached(down.found)
  const cycles = findCycles(g, id)
  const unusual = unusualRelations(g, id, depth)

  // vínculos que atravessam mundos: reaproveita os caminhos já enumerados
  const cross = new Map()
  const keep = (rid, f) => { if (f && !cross.has(rid)) cross.set(rid, { id: rid, parts: f.parts, steps: f.steps || [], worlds: f.worlds, certainty: f.certainty }) }
  ancestors.forEach((r) => { if (g.chars.get(r.id).worldId !== c.worldId || r.paths[0].trace.some((e) => crosses(g, e))) keep(r.id, lineFinding(g, id, r.id, 'ancestor', r.paths)) })
  descendants.forEach((r) => { if (g.chars.get(r.id).worldId !== c.worldId || r.paths[0].trace.some((e) => crosses(g, e))) keep(r.id, lineFinding(g, id, r.id, 'descendant', r.paths)) })
  uniq([...direct.siblings, ...direct.spouses, ...direct.partners].map((x) => x.id)).forEach((rid) => {
    if (cross.has(rid) || g.chars.get(rid).worldId === c.worldId) return
    keep(rid, relate(g, id, rid, { maxDepth: 2 }).findings[0])
  })
  const counterparts = (g.raw.crossWorldConnections?.counterpartGroups || [])
    .filter((grp) => Object.values(grp.members).includes(id))
    .flatMap((grp) => Object.values(grp.members).filter((m) => m !== id && g.chars.has(m)).map((m) => ({ id: m, worldId: g.chars.get(m).worldId })))

  const self = cycles.find((x) => x.genetic) || cycles[0]
  const summary = [
    nm(g, id), ` (${worldName(g, c.worldId)})`,
    ...parentsSentence(g, c, direct.parents),
    '. ',
    direct.children.length ? `Tem ${plural(direct.children.length, 'filho', 'filhos')}. ` : '',
    `Foram mapeados ${plural(ancestors.length, 'ancestral', 'ancestrais')} e ${plural(descendants.length, 'descendente', 'descendentes')} em até ${plural(depth, 'geração', 'gerações')}. `,
    self ? `Participa de ${plural(cycles.length, 'ciclo genealógico', 'ciclos genealógicos')}: é ancestral de si mesm${pick(c.gender, 'o', 'a')} em ${plural(self.length, 'geração', 'gerações')}. ` : '',
    unusual.length ? `${plural(unusual.length, 'relação incomum', 'relações incomuns')}. ` : '',
    cross.size ? `${plural(cross.size, 'vínculo', 'vínculos')} com outros mundos.` : '',
  ]

  return {
    id, depth, summary, direct,
    ancestors: groupByGeneration(g, ancestors, ancestorTitle, 'up'),
    descendants: groupByGeneration(g, descendants, descendantTitle, 'down'),
    totals: { ancestors: ancestors.length, descendants: descendants.length },
    cycles, unusual, crossWorld: [...cross.values()], counterparts,
  }
}

export const kinshipLabels = { parentTitle, childTitle, siblingTitle, DERIVED_PT }
