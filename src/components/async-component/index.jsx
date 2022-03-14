import { Suspense, useState, useRef, useEffect } from 'react'
import { Skeleton } from 'antd'

function AsyncComponent ({ children, loadingDelay = 0 }) {
  const [loading, setLoading] = useState(false)
  const delay = useRef(0)

  useEffect(() => {
    delay.current = setTimeout(() => setLoading(true), loadingDelay)
    return () => {
      clearTimeout(delay.current)
    }
  }, [loadingDelay])

  return (
    <Suspense fallback={loading && <Skeleton />}>
      {children}
    </Suspense>
  )
}

export default AsyncComponent
