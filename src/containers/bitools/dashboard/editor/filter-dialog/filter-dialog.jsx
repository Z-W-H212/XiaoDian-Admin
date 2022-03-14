import { useState, useMemo, useContext, useEffect, useReducer } from 'react'
import { Modal, Checkbox, Select } from 'antd'
import Paragraph from '@/components/layout/Paragraph'
import Sider from './sider.jsx'
import FilterForm from '@/components/filter-form'
import Context from '../Context'
import FilterContext from './filter-context'
import model from './model'

import style from './style.module.less'

const { Block, Content } = Paragraph
const { Option } = Select

export default function FilterWrap (props) {
  const [state, dispatch] = useReducer(model.reducer, model.state)
  return (
    <FilterContext.Provider value={{ state, dispatch }}>
      <FilterDialog {...props} />
    </FilterContext.Provider>
  )
}

function FilterDialog (props) {
  const editModel = useContext(Context)
  const { state, dispatch } = useContext(FilterContext)
  const { componentMap, refTargetMap } = state

  const [selectedId, setSelectedId] = useState()

  useEffect(() => {
    dispatch({
      type: 'initFilter',
      payload: { filterList: editModel.state.filterList },
    })
  }, [editModel.state.filterList])

  const onParamChange = (data) => {
    dispatch({
      type: 'setComponentData',
      payload: {
        id: selectedId,
        data: { ...data, dataType: 'STRING' },
      },
    })
  }

  const onRefChange = (id, checked, refColName) => {
    const data = { ...refTargetMap[selectedId] }
    if (checked) {
      data[id] = refColName
    } else {
      delete data[id]
    }
    dispatch({
      type: 'setRefTargetMap',
      payload: { refTargetMap: { ...refTargetMap, [selectedId]: data } },
    })
  }

  const onOk = () => {
    const { filterHandleList, componentMap, refTargetMap } = state
    const filterList = []
    filterHandleList.forEach(({ id, title }) => {
      const data = componentMap[id]
      data.label = title
      data.paramName = id
      data.refParamMap = refTargetMap[id]
      filterList.push(data)
    })
    editModel.dispatch({
      type: 'setFilterList',
      payload: { filterList },
    })
    props.onOk && props.onOk()
  }

  const componentConfig = useMemo(() => {
    const data = componentMap[selectedId]
    if (!data) {
      return null
    }
    return <FilterForm key={selectedId} data={data} onChange={onParamChange} />
  }, [selectedId, componentMap])

  const refMapConfig = useMemo(() => {
    if (!refTargetMap[selectedId]) {
      return null
    }
    const refParamMap = refTargetMap[selectedId]
    return (
      <RefMap
        refParamMap={refParamMap}
        onRefChange={onRefChange}
      />
    )
  }, [selectedId, refTargetMap])

  return (
    <Modal
      className={style.dialog}
      title="筛选器设置"
      visible
      onOk={onOk}
      onCancel={props.onCancel}
    >
      <Paragraph>
        <Block className={style.sider}><Sider onSelect={id => setSelectedId(id)} /></Block>
        <Content padding={8}>
          <Paragraph>
            <Content>{componentConfig}</Content>
            <Block className={style.sider} width={350}>
              {refMapConfig}
            </Block>
          </Paragraph>
        </Content>
      </Paragraph>
    </Modal>
  )
}

function RefMap (props) {
  const { state } = useContext(Context)
  const { reportConfigMap, blockMap } = state
  const { refParamMap } = props

  const onClick = (id, checked, refColName) => {
    props.onRefChange && props.onRefChange(id, checked, refColName)
  }

  const onChange = (id, refColName) => {
    props.onRefChange && props.onRefChange(id, true, refColName)
  }

  const list = useMemo(() => {
    const list = []
    Object.keys(blockMap).forEach((key) => {
      const { id } = blockMap[key]

      if (!id) { return }
      if (!reportConfigMap[id]) { return }

      const { title, fieldList } = reportConfigMap[id]
      if (fieldList.length === 0) { return }

      const checked = !!refParamMap[id]
      let select
      const refColName = refParamMap[id] || fieldList[0].colName
      if (checked) {
        select = (
          <Select className="select-size-l" value={refColName} onChange={value => onChange(id, value)}>
            {fieldList.map(({ colName, colAlias }) => {
              return <Option key={colName} value={colName}>{colAlias}</Option>
            })}
          </Select>
        )
      }

      const item = (
        <div key={id} className={style.refRow}>
          <div className={style.refResource}>
            <Checkbox checked={checked} onClick={() => onClick(id, !checked, refColName)} />
            {title}
          </div>
          {select}
        </div>
      )
      list.push(item)
    })
    return list
  }, [reportConfigMap, refParamMap, blockMap])

  return (
    <div>
      {list}
    </div>
  )
}
