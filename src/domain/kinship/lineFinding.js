import { crosses, edgeWorlds, traceSteps, weakest } from './evidence.js'
import { genderOf, nm } from './naming.js'
import { ancestorTitle, descendantTitle, withGens } from './titles.js'
import { uniq } from './utils.js'

// Achado de linha direta (ancestral/descendente) a partir de caminhos já enumerados.
export function lineFinding(g, a, b, kind, paths) {
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
