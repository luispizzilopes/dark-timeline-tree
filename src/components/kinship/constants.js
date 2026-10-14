import { WORLD } from '../../data/dataset.js'

export const DEPTHS = [1, 2, 3, 4, 6, 8]
export const CERTAINTY_OPTIONS = [[-1, 'Todas'], [1, '≥ média'], [2, '≥ alta'], [3, 'Confirmadas']]
export const ANC_LABEL = ['', 'Pais', 'Avós', 'Bisavós', 'Trisavós', 'Tetravós', 'Pentavós']
export const DESC_LABEL = ['', 'Filhos', 'Netos', 'Bisnetos', 'Trinetos', 'Tetranetos', 'Pentanetos']

export const genLabel = (labels, n, fallback) => (labels[n] ? `${labels[n]} · ${n}ª geração` : `${fallback} de ${n}ª geração`)
export const worldsText = (ids) => (ids || []).map((w) => WORLD[w]?.name || w).join(' ↔ ')
