import { useMemo } from 'react'
import { getEnv } from '@dian/app-utils'

const env = getEnv()

export default function useMonitorUrl (pathname?: string): string {
  return useMemo(() => {
    const thePathname = pathname || ''
    if (env === 'real') {
      return `//x.dian.so${thePathname}`
    }
    return `${window.location.origin.replace('//x-admin', '//x')}${pathname || ''}`
  }, [pathname])
}
