import { pick } from './utils.js'

// Nomes, gênero e referências a personagens dentro dos textos gerados.
export const strip = (s) => s.replace(/\s*\(.*?\)\s*/g, ' ').trim()
export const displayName = (g, id) => {
  const c = g.chars.get(id)
  return c ? strip(c.name).split(' / ')[0].trim() : id
}
export const genderOf = (g, id) => g.chars.get(id)?.gender
export const worldName = (g, wid) => g.worlds.get(wid)?.name || wid
export const worldList = (g, ids) => {
  const n = ids.map((w) => worldName(g, w))
  return n.length > 1 ? `${n.slice(0, -1).join(', ')} e ${n.at(-1)}` : n[0] || ''
}

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

// Parte de texto que referencia um personagem: { id, text }.
export const nm = (g, id, ctx) => {
  const c = g.chars.get(id), text = displayName(g, id)
  if (c && ctx && c.worldId !== ctx && ambiguousNames(g).get(text)?.size > 1) return { id, text: `${text} (${worldName(g, c.worldId)})` }
  return { id, text }
}
export const own = (g, id) => [pick(genderOf(g, id), 'do próprio ', 'da própria '), nm(g, id)]

export const partsToText = (parts) => parts.flat(Infinity).map((p) => (typeof p === 'string' ? p : p.text)).join('')
