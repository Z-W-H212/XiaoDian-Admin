import { useMemo } from 'react'
import Preview from '@/components/Preview'
import useParseSearch from '@/hooks/useParseSearch'

export default function PreviewWrap (props) {
  const { id, params, from } = useParseSearch(props)
  return useMemo(() => {
    const theParams = params ? JSON.parse(params) : {}
    return (
      <Preview
        key={id}
        {...props}
        id={id}
        params={theParams}
        from={from}
      />
    )
  }, [id, params])
}
