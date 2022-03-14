import { useRef, useState, useMemo, useEffect } from 'react'
import { Select, Spin } from 'antd'
import debounce from 'lodash/debounce'

function DebounceSelect ({ fetchOptions, actionRef, params, debounceTimeout = 400, ...props }) {
  const [fetching, setFetching] = useState(false)
  const [options, setOptions] = useState([])
  const fetchRef = useRef(0)
  const debounceFetcher = useMemo(() => {
    const loadOptions = (value) => {
      fetchRef.current += 1
      const fetchId = fetchRef.current
      setOptions([])
      setFetching(true)
      fetchOptions(value).then((newOptions) => {
        if (fetchId !== fetchRef.current) {
          // for fetch callback order
          return
        }

        setOptions(newOptions)
        setFetching(false)
      })
    }

    return debounce(loadOptions, debounceTimeout)
  }, [fetchOptions, debounceTimeout])

  useEffect(() => {
    debounceFetcher()
  }, [JSON.stringify(params)])

  useEffect(() => {
    const action = {
      reload: debounceFetcher,
    }

    if (actionRef) {
      if (typeof actionRef === 'function') {
        actionRef(action)
      } else {
        actionRef.current = action
      }
    }
  }, [JSON.stringify(params)])

  return (
    <Select
      labelInValue
      filterOption={false}
      onSearch={debounceFetcher}
      notFoundContent={fetching ? <Spin size="small" /> : null}
      {...props}
      options={options}
    />
  )
}

export default DebounceSelect
