import { useState } from 'react'

export function useLineVisibility() {
  const [lines, setLines] = useState({ parent: true, cycle: true, spouse: true, partner: true })
  const toggleLine = (k) => setLines((l) => ({ ...l, [k]: !l[k] }))
  return [lines, toggleLine]
}
