export const uniq = (a) => [...new Set(a)]
export const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`
export const pick = (gender, m, f, u = m) => (gender === 'female' ? f : gender === 'male' ? m : u)
export const listPt = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} e ${a.at(-1)}` : a[0])
export const yearOf = (s) => { const m = /\d{4}/.exec(s || ''); return m ? +m[0] : null }
