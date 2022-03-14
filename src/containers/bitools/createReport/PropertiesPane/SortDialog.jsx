import { useEffect, useContext, useState } from 'react'
import { Modal, Checkbox, Radio, Table, Select } from 'antd'

import formatTagName from '@/utils/format-tag-name'
import Context from '../Context'
import style from './style.module.less'

const columns = [
  {
    key: 'colName',
    dataIndex: 'colName',
    title: '字段名称',
    width: 100,
    render (value, recode) {
      let val = formatTagName(recode)
      recode.aggregate && (val += `(${recode.aggregate})`)
      return val
    },
  },
  {
    key: 'other',
    title: '是否排序',
    width: 100,
    render (value, recode) {
      const { type, colName } = recode
      return <Checkbox value={`${colName}&${type}`} />
    },
  },
]

export default function Sort (props) {
  const { state, dispatch } = useContext(Context)
  const { dimensionMap, indexMap } = state

  const [defaultSort, setDefaultSort] = useState(state.defaultSort)
  const [sortKey, setSortKey] = useState(state.defaultSortKey)
  const [sortList, setSortList] = useState(state.sortList)

  useEffect(() => {
    setSortList(state.sortList)
  }, [state.sortList])

  // 这里处理默认的<Select value={}/>格式
  useEffect(() => {
    if (state.defaultSortKey && dimensionMap[state.defaultSortKey]) {
      const { type } = dimensionMap[state.defaultSortKey]
      setSortKey(`${state.defaultSortKey}&${type}`)
    }
  }, [])

  const data = []

  Object.keys(dimensionMap).forEach((key) => {
    data.push({ ...dimensionMap[key], colName: key })
  })
  Object.keys(indexMap).forEach((key) => {
    data.push({ ...indexMap[key], colName: key })
  })

  if (state.mode) {
    for (const col of state.fieldList) {
      if (indexMap[col.colName] || dimensionMap[col.colName]) {
        continue
      }
      data.push(col)
    }
  }

  function onOk () {
    const fieldListCopy = [...state.fieldList]
    const keys = sortList.filter(i => i).map(e => (e.split('&')[0]))

    state.fieldList.forEach((e, i) => {
      if (keys.indexOf(e.colName) >= 0) {
        fieldListCopy[i]._source = 'conflict'
        fieldListCopy[i].sort = true
      } else {
        fieldListCopy[i].sort = false
      }
      if (sortKey && (sortKey.split('&')[0] === e.colName)) {
        fieldListCopy[i]._source = 'conflict'
      }
    })

    dispatch({ type: 'setFieldList', payload: { fieldList: fieldListCopy } })
    dispatch({
      type: 'setSort',
      payload: {
        sortList,
        defaultSortKey: sortKey,
        defaultSort,
      },
    })
    props.onOk()
  }

  const handleDefaultSortChange = (key) => {
    setSortKey(key)

    // 如果清除默认排序，也要把默认排序方式也置空
    if (!key) {
      setDefaultSort('')
      return
    }

    // 如果设置默认排序，并且没有排序规则（第一次设置），则默认选择一个倒序
    if (key && !sortKey && defaultSort === '') {
      setDefaultSort('DESC')
    }
  }

  const handleFieldSortChange = (k) => {
    setSortList(k)
  }

  return (
    <Modal
      title="设置排序字段"
      visible
      onOk={onOk}
      onCancel={props.onCancel}
    >
      <span>默认排序字段：</span>
      <Select className="select-size-m" placeholder="选择默认排序字段" allowClear value={sortKey} onChange={handleDefaultSortChange}>
        {data.map((item, i) => {
          const { colName, type, aggregate } = item
          const value = `${colName}&${type}`
          return (
            <Select.Option key={`sort-${i}`} value={value}>
              {formatTagName(item)}{aggregate && `(${aggregate})`}
            </Select.Option>
          )
        })}
      </Select>
        &nbsp;
      <Radio.Group value={defaultSort} onChange={e => setDefaultSort(e.target.value)}>
        <Radio value="ASC">升序</Radio>
        <Radio value="DESC">降序</Radio>
      </Radio.Group>
      <div style={{ paddingBottom: '10px' }} />
      {
        state.defaultReportType === 'TABLE' && (
          <Checkbox.Group
            className={style.group}
            value={sortList}
            onChange={handleFieldSortChange}
          >
            <Table
              size="small"
              rowKey={m => `${m.colName}&${m.type}`}
              columns={columns}
              dataSource={data}
              pagination={false}
              scroll={{ y: 300 }}
            />
          </Checkbox.Group>

        )
      }
    </Modal>
  )
}
