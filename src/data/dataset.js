import raw from './dark-genealogia.json'
import { buildKinshipGraph } from '../domain/kinship/index.js'

export const DATA = raw
export const KG = buildKinshipGraph(raw)
export const CH = Object.fromEntries(raw.characters.map((c) => [c.id, c]))
export const WORLD = Object.fromEntries(raw.worlds.map((w) => [w.id, w]))
export const PARADOX = Object.fromEntries(raw.paradoxes.map((p) => [p.id, p]))
export const GROUP_BY_SLUG = Object.fromEntries(raw.crossWorldConnections.counterpartGroups.map((g) => [g.slug, g]))
