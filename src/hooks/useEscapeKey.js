import { useEffect } from 'react'

export function useEscapeKey(handler) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && handler()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })
}
