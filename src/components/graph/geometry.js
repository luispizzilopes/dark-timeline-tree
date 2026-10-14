export const R = 34 // raio do nó

export const hasParadox = (e) => e.paradoxIds && e.paradoxIds.length > 0

export function splitName(n) {
  if (n.length <= 13) return [n]
  const i = n.lastIndexOf(' ', 13) > 0 ? n.lastIndexOf(' ', 13) : n.indexOf(' ')
  return i > 0 ? [n.slice(0, i), n.slice(i + 1)] : [n]
}
export const initials = (n) => n.split(' ').map((p) => p[0]).slice(0, 2).join('')

export function edgePath(a, b, isBack) {
  if (isBack || b.y <= a.y) {
    const bulge = 90 * (a.x <= b.x ? 1 : -1) || 90
    return `M${a.x},${a.y - R} C${a.x + bulge},${a.y - R - 70} ${b.x + bulge},${b.y + R + 70} ${b.x},${b.y + R}`
  }
  const y1 = a.y + R, y2 = b.y - R, m = (y1 + y2) / 2
  return `M${a.x},${y1} C${a.x},${m} ${b.x},${m} ${b.x},${y2}`
}

export function spousePath(a, b) {
  return a.y === b.y
    ? `M${Math.min(a.x, b.x) + R},${a.y} L${Math.max(a.x, b.x) - R},${a.y}`
    : `M${a.x},${a.y + R} Q${(a.x + b.x) / 2},${Math.max(a.y, b.y) + R + 55} ${b.x},${b.y + R}`
}

export const partnerPath = (a, b) => `M${a.x},${a.y + R} Q${(a.x + b.x) / 2},${Math.max(a.y, b.y) + R + 85} ${b.x},${b.y + R}`
