// Motor de parentesco e paradoxos genealógicos.
//
// Orientado a grafos e 100% dirigido pelos dados: a única fonte de verdade é
// `raw.relationships` (com `characters`, `identities`, `worlds` e `paradoxes` usados
// só para rotular e associar). Nenhuma regra menciona personagem específico, então
// novos personagens/relações no JSON passam a ser analisados sem mudar o motor.
//
// Todo texto gerado é uma lista de "partes": strings e { id, text } (referência a um
// personagem). Isso permite renderizar nomes clicáveis e também achatar para texto puro.
export { ANCESTRY_KINDS, BIOLOGICAL, CERTAINTY_RANK } from './constants.js'
export { CERTAINTY_PT, EVIDENCE_PT, PARENT_KIND_PT, DERIVED_PT } from './labels.js'
export { buildKinshipGraph, withMinCertainty } from './graphBuilder.js'
export { displayName, partsToText, worldList } from './naming.js'
export { ancestorTitle, childTitle, descendantTitle, parentTitle, siblingTitle } from './titles.js'
export { findCycles, isInCycle } from './cycles.js'
export { directKin } from './directKin.js'
export { relate } from './relate.js'
export { analyze } from './analyze.js'
