/* eslint-disable eqeqeq */
import { useState, useMemo } from 'react'
import Report from '@/components/Report'
import SearchForm from '@/components/SearchForm'
import { useHistory } from 'react-router-dom'

import style from './style.module.less'

function transfromSearch (values = {}, paramList = []) {
  const searchMap = {}
  paramList.forEach((item) => {
    const { paramName, valDefault, refParamMap } = item
    Object.keys(refParamMap).forEach((id) => {
      const key = refParamMap[id]
      let value = valDefault
      if (values[paramName] != undefined) { value = values[paramName] }
      if (value == undefined) { return }
      if (!searchMap[id]) {
        searchMap[id] = {}
      }
      searchMap[id][key] = value
    })
  })
  return searchMap
}

export default function Dashboard (props) {
  const { params } = props
  const { list } = props.data

  const paramList = useMemo(() => {
    if (!props.data.paramList) { return [] }
    return props.data.paramList
  }, [props.data.paramList])

  const [searchMap, setSearchMap] = useState(transfromSearch(params, paramList))
  const searchData = useMemo(() => {
    const list = []
    paramList.forEach((item) => {
      const m = { ...item }
      if (params && params[m.key]) {
        m.placeholder = params[item.key]
      }
      list.push(m)
    })
    return list
  }, [paramList, params])

  const onSubmit = (values) => {
    const searchMap = transfromSearch(values, paramList)
    setSearchMap(searchMap)
  }

  return (
    <div>
      <SearchForm data={searchData} onSubmit={onSubmit} />
      <Panel {...props} data={list || []} searchMap={searchMap} />
    </div>
  )
}

function Panel (props) {
  const history = useHistory()
  const { data, searchMap, isSlot } = props

  const children = useMemo(() => {
    return data.map((item, i) => {
      const searchData = searchMap[item.id] || {}
      return (
        <div key={i} className={style.resourceWrap} style={{ width: `${item.width}%` }}>
          <div className={style.resource}>
            <Report
              key={item.id} id={item.id} params={searchData} showSearch={false} isSlot={isSlot}
              history={history}
            />
          </div>
        </div>
      )
    })
  }, [data, searchMap])

  return (
    <div className={style.panel}>
      <div className={style.blockList}>
        {children}
      </div>
    </div>
  )
}
