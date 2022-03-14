import { createRef, useContext, useEffect, useState } from 'react'
import { Table, Button, Tooltip, Space, Tag } from 'antd'
import Context from '../Context'
import EditModal from './edit-modal.jsx'

/**
 * @returns {FieldTable} 数据集字段报表
 */
function FieldTable (props) {
  const { onClickEdit, onClickRemove, dataSource } = props
  const keys = [
    {
      key: '_source',
      dataIndex: '_source',
      title: '字段来源',
      width: 80,
      align: 'center',
      render (value) {
        const isParse = value === 'parse'
        return <Tag color={!isParse && 'blue'}>{isParse ? '解析' : '手工'}</Tag>
      },
    },
    { key: 'colName', dataIndex: 'colName', title: '字段名' },
    { key: 'colType', dataIndex: 'colType', title: '字段类型', width: 100 },
    {
      key: 'colAlias',
      dataIndex: 'colAlias',
      title: '别名',
    },
    {
      key: 'tagAlias',
      dataIndex: 'tagAlias',
      title: '业务指标名',
      width: 150,
      render (value, row) {
        const { tagRemark, tagTimePeriod } = row
        const remark = tagRemark ? `(${tagRemark})` : ''
        return <div>{tagTimePeriod}{value}<div>{remark}</div></div>
      },
    },
    { key: 'isShow', dataIndex: 'isShow', title: '前端展示', width: 100, render: bool => (bool ? '是' : '否') },
    {
      key: 'ifRateIndex',
      dataIndex: 'ifRateIndex',
      title: '是否比率指标',
      width: 100,
      render: bool => (bool ? '是' : '否'),
    },
    {
      key: 'ifCalSamePeriodCompare',
      dataIndex: 'ifCalSamePeriodCompare',
      title: '计算同环比',
      width: 100,
      render: bool => (bool ? '是' : '否'),
    },
    { key: 'decimal', dataIndex: 'decimal', title: '小数位数', width: 100 },
    {
      key: 'round',
      dataIndex: 'round',
      title: '四舍五入',
      width: 100,
      render: bool => (bool ? '是' : '否'),
    },
    {
      key: 'separator',
      dataIndex: 'separator',
      title: '千位分隔符',
      width: 100,
      render: bool => (bool ? '是' : '否'),
    },
    {
      key: 'colDesc',
      dataIndex: 'colDesc',
      title: '口径说明',
      ellipsis: true,
      width: 100,
      render (value, row) {
        return <Tooltip placement="bottomLeft" title={value}>{value}</Tooltip>
      },
    },
    {
      key: 'customConfig',
      dataIndex: 'customConfig',
      title: '个性配置信息',
      ellipsis: true,
      width: 100,
      render (value, row) {
        const keys = []
        value && value.forEach(item => keys.push(item.key))
        return <Tooltip placement="bottomLeft" title={keys.join(',')}>{keys.join(',')}</Tooltip>
      },
    },
    {
      key: 'other',
      dataIndex: 'other',
      title: '操作',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (value, row) => (
        <div>
          <a onClick={onClickEdit.bind(this, row)}>编辑</a> &nbsp;
          {
            row._source === 'parse'
              ? <Tooltip placement="bottom" title="解析字段不能删除"><Button type="link" size="small" disabled>删除</Button></Tooltip>
              : <Button type="link" size="small" onClick={onClickRemove.bind(this, row)}>删除</Button>
          }
        </div>
      ),
    },
  ]

  const dataSourceMap = dataSource.map((e, i) => ({ ...e, key: e.colName, _index: i }))

  return <Table size="middle" columns={keys} dataSource={dataSourceMap} scroll={{ x: 1450 }} />
}

export default function PanelFields () {
  const formRef = createRef()
  const { state, dispatch } = useContext(Context)

  const [modalVisible, setModalVisible] = useState(false) // 编辑窗口是否展示
  const [editRowIndex, setEditRowIndex] = useState(null) // 编辑模式下对应编辑行的下标，null则为创建
  const [formDefaultValues, setFormDefaultValues] = useState(null) // 编辑模式下，表单预设值

  // 进入编辑状态，填充表单预设value
  useEffect(() => {
    setFormDefaultValues(editRowIndex !== null ? state.fieldList[editRowIndex] : null)
  }, [editRowIndex, state.fieldList])

  const handleClickAdd = () => {
    setModalVisible(true)
    setEditRowIndex(null)
  }

  /**
   * 删除数据集字段功能
   * @param {*} row 删除数据的信息
   */
  const handleClickRemove = (row) => {
    const fieldList = [
      ...state.fieldList.slice(0, row._index),
      ...state.fieldList.slice(row._index + 1),
    ]

    const item = state.fieldList[row._index]
    // 如果删除的key被设为默认排序时，清除默认排序
    if (state.defaultSortKey.indexOf(item.colName) >= 0) {
      dispatch({
        type: 'setSort',
        payload: {
          sortList: state.sortList,
          defaultSortKey: '',
          defaultSort: '',
        },
      })
    }
    const { colName, type } = state.fieldList[row._index]
    if (type === 'dimension') {
      dispatch({ type: 'closeDimension', payload: { colName } })
    } else if (type === 'index') {
      dispatch({ type: 'closeIndex', payload: { colName } })
    }
    dispatch({ type: 'setFieldList', payload: { fieldList } })
    dispatch({ type: 'delParamKey', payload: { colName } })
    dispatch({ type: 'delAnchor', payload: { colName } })
  }

  /**
   * @param {*} row 当前编辑的数据
   * 打开编辑窗口
   */
  const handleClickEdit = (row) => {
    setModalVisible(true)
    setEditRowIndex(row._index)
  }

  const onSubmit = () => {
    const { validateFields } = formRef.current?.form

    validateFields(null, { force: true }, (err, values) => {
      if (err) {
        return
      }
      values.colAlias = values.colAlias || values.colName
      values._source = 'manual'
      // values.type = 'dimension'

      const fieldListCopy = [...state.fieldList]

      let fieldList
      if (editRowIndex !== null) {
        fieldListCopy[editRowIndex] = {
          ...state.fieldList[editRowIndex],
          ...values,
        }
        fieldList = fieldListCopy
      } else {
        fieldList = [values, ...fieldListCopy]
      }
      dispatch({ type: 'setFieldList', payload: { fieldList } })
      dispatch({ type: 'setParamKeyList', payload: { fieldList } })
      setEditRowIndex(null)
      setModalVisible(false)
    })
  }

  const onCancel = () => {
    setEditRowIndex(null)
    setModalVisible(false)
  }

  return (
    <div>
      <Space style={{ margin: 16 }}>
        <Button onClick={handleClickAdd}>添加字段</Button>
      </Space>
      <FieldTable
        dataSource={state.fieldList}
        onClickEdit={handleClickEdit}
        onClickRemove={handleClickRemove}
      />
      <EditModal
        visible={modalVisible}
        wrappedComponentRef={formRef}
        defaultValues={formDefaultValues}
        fieldList={state.fieldList}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </div>
  )
}
