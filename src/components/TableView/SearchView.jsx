import { useMemo } from 'react'
import SearchForm from '@/components/SearchForm'
import { useLocation } from 'react-router-dom'

export default function SearchView (props) {
  const { paramList, paramMap, onReset, showSearch } = props
  const location = useLocation()

  const searchData = useMemo(() => {
    const list = []

    paramList.filter(item => item.visible || location.pathname === '/bi/preview').forEach((item) => {
      const m = { ...item }
      if (paramMap[m.paramName] !== undefined) {
        m.queryValue = paramMap[item.paramName]
      }
      list.push(m)
    })

    return list
  }, [paramList, paramMap])

  const onSearch = (data) => {
    props.onSearch && props.onSearch(data)
  }

  return (
    <SearchForm
      showSearch={showSearch}
      data={searchData}
      onSubmit={onSearch}
      onReset={onReset}
    />
  )
}
