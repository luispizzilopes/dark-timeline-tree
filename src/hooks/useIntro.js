import { useEffect, useState } from 'react'

// `true` durante a abertura; vira `false` após `ms`.
export function useIntro(ms = 2600) {
  const [intro, setIntro] = useState(true)
  useEffect(() => { const t = setTimeout(() => setIntro(false), ms); return () => clearTimeout(t) }, [ms])
  return intro
}
