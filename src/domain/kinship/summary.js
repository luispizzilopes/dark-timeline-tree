import { nm, worldName } from './naming.js'
import { pick, plural } from './utils.js'

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

export function buildSummary(g, id, { direct, ancestors, descendants, cycles, unusual, crossCount, depth }) {
  const c = g.chars.get(id)
  const self = cycles.find((x) => x.genetic) || cycles[0]
  return [
    nm(g, id), ` (${worldName(g, c.worldId)})`,
    ...parentsSentence(g, c, direct.parents),
    '. ',
    direct.children.length ? `Tem ${plural(direct.children.length, 'filho', 'filhos')}. ` : '',
    `Foram mapeados ${plural(ancestors.length, 'ancestral', 'ancestrais')} e ${plural(descendants.length, 'descendente', 'descendentes')} em até ${plural(depth, 'geração', 'gerações')}. `,
    self ? `Participa de ${plural(cycles.length, 'ciclo genealógico', 'ciclos genealógicos')}: é ancestral de si mesm${pick(c.gender, 'o', 'a')} em ${plural(self.length, 'geração', 'gerações')}. ` : '',
    unusual.length ? `${plural(unusual.length, 'relação incomum', 'relações incomuns')}. ` : '',
    crossCount ? `${plural(crossCount, 'vínculo', 'vínculos')} com outros mundos.` : '',
  ]
}
