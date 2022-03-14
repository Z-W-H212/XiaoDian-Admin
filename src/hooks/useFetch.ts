import { useState, useCallback } from 'react'

export interface OptionsData {
  data?: unknown
  refresh?: boolean
}
export interface RequestState {
  error: boolean | null,
  loading: boolean,
  data: any,
  query: unknown | null,
}
type ServiceFn = (...arg: any[]) => Promise<any>

function useFetch (service: ServiceFn, options: OptionsData = {}): [RequestState, (...arg: any) => Promise<any>] {
  const { refresh, data } = options
  const [error, setError] = useState<boolean | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [resData, setData] = useState<any>(data || null)
  const [query, setQuery] = useState<any>()

  const fetch = useCallback(async function (...arg: any[]) {
    if (!service) return
    setError(null)
    setLoading(true)
    setQuery(arg[0])
    refresh && setData(data || null)
    try {
      const res = await service(...arg)
      setData(res)
      setLoading(false)
      return res
    } catch (error: any) {
      setError(error.toString())
      setLoading(false)
      // error可能不是error对象或字符串
      if (typeof error === 'object') {
        throw new Error(JSON.stringify(error)).toString()
      }
      throw new Error(error).toString()
    }
  }, [service, data, refresh])

  return [{ error, loading, data: resData, query }, fetch]
}

export default useFetch
