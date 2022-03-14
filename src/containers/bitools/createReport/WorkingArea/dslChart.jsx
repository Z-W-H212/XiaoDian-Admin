import { useMemo, useContext } from 'react'
import { useDrag } from 'react-dnd'
import { CalendarOutlined, FontSizeOutlined, NumberOutlined } from '@ant-design/icons'
import { Spin } from 'antd'
import Target from '@/components/base/Target'
import Context from '../Context'

import useFetch from '@/hooks/useFetch'
import { getTableInfo, getOrganization } from '@/services/databaseService'
import style from './style.module.less'

function Drag (props) {
  const { colName } = props.data
  const type = colName === '#organization#' ? 'organization' : 'field'
  const [, drag] = useDrag({
    item: { ...props.data, type },
    collect (monitor) {
      return {
        isDragging: monitor.isDragging(),
      }
    },
  })
  return (
    <div ref={drag}>
      {props.children}
    </div>
  )
}

export default function DslChart (props) {
  const { state } = useContext(Context)
  const [organizationRes] = useFetch(getOrganization, { data: [] })
  const [tableInfoRes] = useFetch(getTableInfo, { data: {} })

  const { dimensionMap, indexMap } = state

  // const orgTarget = useMemo(() => {
  //   const data = { colName: '#organization#', colAlias: '组织架构' }
  //   return (
  //     <Drag key="#organization#" data={data}>
  //       <Target className={style.target} title="组织架构" />
  //     </Drag>
  //   )
  // }, [organizationRes.data])

  const dragFieldList = useMemo(() => {
    return state.fieldList.map((field) => {
      const { colName, colAlias, colType, isNumber } = field
      let theIcon = <FontSizeOutlined />
      if (isNumber) {
        theIcon = <NumberOutlined />
      } else if ((/date/).test(colType)) {
        theIcon = <CalendarOutlined />
      }

      const title = <div>{theIcon}&nbsp;{colAlias || colName}</div>
      const highlight = !!(dimensionMap[colName] || indexMap[colName])
      return (
        <Drag key={colName} data={field}>
          <Target
            className={style.target}
            title={title}
            htmlTitle={colName}
            highlight={highlight}
          />
        </Drag>
      )
    })
  }, [state.fieldList, dimensionMap, indexMap])

  return (
    <Spin spinning={organizationRes.loading || tableInfoRes.loading}>
      <div className={style.database}>
        <div className={style.scroll}>
          <h2 className={style.title}>字段</h2>
          {/* {orgTarget} */}
          {dragFieldList}
        </div>
      </div>
    </Spin>
  )
}
