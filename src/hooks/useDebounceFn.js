import { useEffect, useRef } from 'react'

export default function useDebounceFn (fn, deps, wait = 200) {
  const ref = useRef()
  useEffect(() => {
    clearTimeout(ref.current)
    ref.current = setTimeout(fn, wait)
  }, deps)
}
