import { useContext, useMemo } from 'react'
import TableView from '@/components/TableView'

import Context from '../Context'

export default function Panel (props) {
  const { state } = useContext(Context)
  const { paramMap, previewData } = state
  const { colList, pageInfo } = previewData

  const data = useMemo(() => {
    return pageInfo ? pageInfo.list : []
  }, [pageInfo])

  const paramList = useMemo(() => {
    const list = []
    Object.keys(paramMap).forEach((key) => {
      const {
        colName, colAlias, checked, type, dateType, selectorType,
      } = paramMap[key]
      if (!checked) return false

      const colKey = colAlias || colName
      list.push({
        key: colKey,
        placeholder: colKey,
        type,
        refCode: selectorType,
        frequency: dateType,
      })
    })
    return list
  }, [paramMap])

  function onSearch (values) {
  }

  return (
    <TableView
      paramList={paramList}
      paramMap={{}}
      colList={colList || []}
      data={data}
      onSearch={onSearch}
    />
  )
}
