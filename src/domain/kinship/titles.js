import { ANC, DESC, SIB_KIND_PT } from './labels.js'
import { pick, plural } from './utils.js'

export const ancestorTitle = (n, gender) => (ANC[n] ? pick(gender, ANC[n][0], ANC[n][1], ANC[n][2]) : `ancestral de ${n}ª geração`)
export const descendantTitle = (n, gender) => (DESC[n] ? pick(gender, DESC[n][0], DESC[n][1]) : `descendente de ${n}ª geração`)
// "bisavô (3 gerações)" — o rótulo numérico (>6) já traz o número.
export const withGens = (title, n) => (n > 1 && n <= 6 ? `${title} (${n} gerações)` : title)

export const parentTitle = (kind, gender) => {
  if (kind === 'adoptive') return pick(gender, 'pai adotivo', 'mãe adotiva')
  if (kind === 'step') return pick(gender, 'padrasto', 'madrasta')
  if (kind === 'unknown_nature') return 'responsável (vínculo de natureza incerta)'
  return pick(gender, 'pai', 'mãe', 'genitor')
}
export const childTitle = (kind, gender) => {
  if (kind === 'adoptive') return pick(gender, 'filho adotivo', 'filha adotiva')
  if (kind === 'step') return pick(gender, 'enteado', 'enteada')
  if (kind === 'unknown_nature') return 'dependente (vínculo de natureza incerta)'
  return pick(gender, 'filho', 'filha')
}
export const siblingTitle = (kind, gender) => { const t = SIB_KIND_PT[kind] || SIB_KIND_PT.full; return pick(gender, t[0], t[1]) }

// da/db: gerações de A e de B até o ancestral comum; devolve o título de B em relação a A.
export function collateralTitle(da, db, commonCount, gender) {
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
