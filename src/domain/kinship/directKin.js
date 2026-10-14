import { ANCESTRY_KINDS } from './constants.js'

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
