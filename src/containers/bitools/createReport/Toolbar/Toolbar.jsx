import { Fragment, useState, useContext, useEffect, useCallback, useRef } from 'react'
import { Button, message, PageHeader, Tooltip, Tag, Form, Input, Select } from 'antd'
import { useHistory } from 'react-router-dom'
import { LockOutlined, UnlockOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import Context from '../Context'
import {
  createPreview,
  createReport,
  updateReport,
  updateAndPublishReport,
  getDSLFieldList,
  reportLock,
  reportUnlock,
  getReportLockStatus,
} from '@/services/reportService'
import useFetch from '@/hooks/useFetch'
import BaseModal from '../../list/components/BaseModal'
import { obj2Url } from '@/utils/tools'

/**
 *
 * @param {*} props List组件参数
 * @returns 创建报表头部工具
 */
export default function Toolbar (props) {
  let { id, mode, groupId, readOnly, bizType, _groupId } = props
  bizType = +bizType
  const { state, dispatch } = useContext(Context)
  const [params, setParams] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [preview, fetchPreview] = useFetch(createPreview)
  const [lock, setLock] = useState(null)
  const [tag, setTag] = useState('')
  const history = useHistory()
  const [modalData, setModalData] = useState({
    type: '',
    params: {},
  })
  const modalFormRef = useRef()
  /**
   * 上锁状态
   */
  const getReportLock = useCallback(async () => {
    const result = await getReportLockStatus({ id })
    if (result) {
      message.warn('当前报表处于锁定状态，不可编辑')
    }
    setLock(result)
  }, [id])

  useEffect(() => {
    setShowCreate(false)
    typeof state.tag === 'string' && setTag(state.tag)
  }, [state])

  useEffect(() => {
    if (!readOnly && id) {
      getReportLock()
    }

    if (readOnly) {
      message.warn('当前报表处于只读状态，不可编辑')
    }
  }, [getReportLock, id, readOnly])

  /**
   * 点击预发
   * @returns
   */
  async function onPreview () {
    const {
      dbName, tableName, indexMap, drillMap,
      defaultReportType,
      title, desc, code, dsl, permission, cityPermission, nickName, props,
      defaultSortKey, defaultSort, sortList, paramMap, anchorList, xAxis, yAxis,
      cacheStrategy,
    } = state
    const drill = Object.keys(drillMap).map(key => drillMap[key])

    drill.sort((a, b) => a.sequence - b.sequence) // 根据sequence对钻取值进行排序
    const requestData = {
      title,
      desc,
      mode,
      code,
      dsl,
      defaultReportType, // 图表类型
      dbName,
      dataSetName: tableName,
      dataPermission: +permission,
      authType: cityPermission,
      nickName,
      fieldList: [],
      paramList: [],
      drill,
      xAxis,
      yAxis,
      anchor: anchorList,
      cacheStrategy,
    }

    if (defaultReportType !== 'TABLE') {
      requestData.props = props
    }

    const dimensionList = [] // 纬度数组（绘图）

    for (const colName in state.dimensionMap) {
      const item = state.dimensionMap[colName]
      dimensionList.push({ ...item, type: 'dimension', colName, _source: 'conflict', sort: sortList.indexOf(`${colName}&dimension`) > -1 })
    }

    const indexList = [] // 指标数组
    for (const colName in indexMap) {
      const item = indexMap[colName]
      const sort = sortList.indexOf(`${colName}&index`) > -1
      indexList.push({ ...item, type: 'index', _source: 'conflict', colName, sort })
    }

    const fieldList = []
    for (const col of state.fieldList.filter(e => e._source && (e._source !== 'parse'))) {
      if (indexMap[col.colName] || state.dimensionMap[col.colName]) {
        continue
      }
      fieldList.push({ ...col, sequence: fieldList.length })
    }
    dimensionList.sort((a, b) => a.sequence - b.sequence)
    indexList.sort((a, b) => a.sequence - b.sequence)
    requestData.fieldList = dimensionList.concat(indexList)
    if (mode === 'DSL') {
      requestData.fieldList = requestData.fieldList.concat(fieldList)
    }

    /**
     * @params {paramMap} 数据源数据
     */
    for (const key in paramMap) {
      const {
        checked, sequence, paramName, label,
        componentType, dataType, visible, isRange,
        lovValueList, lovReportId,
        valDefault, aggrWithIndex, mechanism, componentCode,
        contraColumns,
      } = paramMap[key]

      if (checked === false) { continue }

      const item = {
        paramName,
        label,
        dataType,
        componentType,
        visible,
        isRange: isRange ? 1 : 0,
        sequence,
        lovReportId,
        lovValueList,
        valDefault,
        aggrWithIndex,
        mechanism,
        componentCode,
        contraColumns,
      }
      requestData.paramList.push(item)
    }
    requestData.paramList.sort((a, b) => {
      return a.sequence - b.sequence
    })

    if (defaultSortKey) {
      const [key, type] = defaultSortKey.split('&')
      requestData.defaultSort = defaultSort
      requestData.defaultSortKey = key

      // DSL 不需要传集合函数
      if (type === 'index' && mode !== 'DSL') {
        requestData.defaultSortKey = `${indexMap[key].aggregate}(${key})`
      }
    }

    if (checkData(requestData, mode) === false) return false
    const previewData = await fetchPreview({
      ...requestData,
      mode: (mode === 'GRAPH') ? 0 : 1,
      fieldList: getReadOnlyFieldList(requestData),
    })
    if (mode === 'DSL') {
      const parseDSLField = await getDSLFieldList({ dbName, dsl, paramList: requestData.paramList })
      const hash = {}
      const newField = [
        // ...state.fieldList.filter(e => (e._source !== 'parse')).map(e => ({ ...e, type: '' })),
        ...requestData.fieldList.filter(e => (e._source !== 'parse')),
        ...parseDSLField.map((e, i) => ({
          ...e,
          type: '',
          sequence: i + requestData.fieldList.length - 1,
          isShow: 1,
          _source: 'parse',
          colAlias: e.colAlias || e.colName,
        })),
      ].reduce((item, next) => {
        if (!hash[next.colName]) {
          hash[next.colName] = true
          item.push(next)
        } else {
          // 有重复的话，忽略但是要给之前冲突的打上标记
          const findConflict = item.findIndex(i => (i.colName === next.colName))
          item[findConflict]._source = 'conflict'
          item[findConflict].colAlias = item[findConflict].colAlias ? item[findConflict].colAlias : next.colAlias
        }
        return item
      }, [])

      // 判断出是创建DSL报表时，初始化dimension
      // if (title === '' && code === '' && defaultReportType === 'TABLE') {
      //   dispatch({ type: 'initialDimension', payload: { fieldList: newField } })
      // }

      dispatch({ type: 'setFieldList', payload: { fieldList: newField } })
      dispatch({ type: 'setParamKeyList', payload: { fieldList: newField } })

      dispatch({
        type: 'setPanelActivedKey',
        payload: { panelActivedKey: `2|${Date.now()}` }, // 无所谓是啥，拿到事件就行
      })
    }

    dispatch({ type: 'setPreviewData', payload: { previewData } })
    setParams(requestData)
    setShowCreate(true)
  }

  function getReadOnlyFieldList (params) {
    return params.fieldList.map(e => (e._source === 'parse' ? null : e)).filter(i => i)
  }

  /**
   * 发布报表
   */
  const onPublish = async () => {
    if (params?.title.length === 0) {
      message.error('请输入标题')
      return
    }

    const fieldList = getReadOnlyFieldList(params)

    setModalData({
      type: 'updateAndPublish',
      params: {
        ...params,
        mode: mode === 'GRAPH' ? 0 : 1,
        fieldList,
        id,
        xAxis: state.xAxis,
        yAxis: state.yAxis,
        bizType,
        groupId,
        tag,
      },
    })

    modalFormRef.current?.resetFields()
  }

  /**
   * 保存报表
   */
  async function handleSaveReport () {
    if (params?.title.length === 0) {
      message.error('请输入标题')
      return
    }

    let success
    const fieldList = getReadOnlyFieldList(params)

    if (id) {
      success = await updateReport({
        ...params,
        mode: mode === 'GRAPH' ? 0 : 1,
        fieldList: getReadOnlyFieldList(params),
        id,
        xAxis: state.xAxis,
        yAxis: state.yAxis,
        bizType,
        groupId,
        tag,
        downloadMaxLimit: state.downloadMaxLimit,
      })
    } else {
      success = await createReport({
        ...params,
        mode: mode === 'GRAPH' ? 0 : 1,
        groupId,
        bizType,
        fieldList,
        xAxis: state.xAxis,
        yAxis: state.yAxis,
        tag,
        downloadMaxLimit: state.downloadMaxLimit,
      })

      history.replace(obj2Url({ _groupId }, `/bi/createReport?mode=${mode}&id=${success}&bizType=${bizType}`))
    }

    if (success) {
      message.success('保存成功！')
    }
  }

  const buttons = [
    <Button key="button-preview" loading={preview.loading} onClick={onPreview}>预览</Button>,
    <Fragment key="button-submit"><Button type="primary" disabled={!showCreate || lock || readOnly} onClick={handleSaveReport}>保存</Button></Fragment>,
    <Fragment key="button-publish"><Button type="primary" disabled={!showCreate || lock || readOnly} onClick={onPublish}>发布</Button></Fragment>,
  ]

  const lockButton = id
    ? (
      <Tooltip key="button-lock" title={`当前报表${lock ? '已' : '未'}锁定，点击${lock ? '解' : '上'}锁`}>
        <Button
          disabled={readOnly}
          loading={lock === null}
          icon={lock ? <LockOutlined /> : <UnlockOutlined />}
          onClick={async () => {
            setLock(null)
            let success
            if (lock) {
              success = await reportUnlock({ id })
            } else {
              success = await reportLock({ id })
            }

            await getReportLock()

            if (success) {
              message.success(`${lock ? '解锁' : '锁定'}成功`)
            }
          }}
        />
      </Tooltip>
    )
    : null

  const handleChange = (value) => {
    dispatch({ type: 'setTag', payload: value })
    setTag(value)
  }

  const forTest = (
    <span style={{ fontWeight: 'normal', fontSize: 'initial', marginLeft: 32 }}>
      <span style={{ marginRight: 8 }}>是否是测试:</span>
      <Select
        style={{ minWidth: 100 }}
        value={tag}
        onChange={handleChange}
        placeholder="请选择"
      >
        <Option value="测试">是</Option>
        <Option value="">否</Option>
      </Select>
    </span>
  )

  return (
    <>
      <PageHeader
        style={{ border: '1px solid #eaeaea' }}
        ghost={false}
        onBack={props.onGoback}
        title={[state.title || '创建', forTest]}
        extra={[readOnly ? <Tag icon={<ExclamationCircleOutlined />} color="warning">只读模式</Tag> : lockButton, ...buttons]}
      />
      <BaseModal
        title="版本备注"
        visible={modalData.type === 'updateAndPublish'}
        formRef={modalFormRef}
        formProps={{
          labelCol: { span: 0 },
          wrapperCol: { span: 24 },
        }}
        onCancel={() => setModalData({ type: '', params: {} })}
        onSubmit={async ({ versionComment }) => {
          const success = await updateAndPublishReport({
            ...modalData.params,
            downloadMaxLimit: state.downloadMaxLimit,
            versionComment,
          })

          if (success) {
            history.replace(obj2Url({ _groupId }, `/bi/createReport?mode=${mode}&id=${success}&bizType=${bizType}`))
            message.success('发布成功！')
            setModalData({ type: '', params: {} })
          }
        }}
      >
        <Form.Item
          name="versionComment"
        >
          <Input.TextArea
            placeholder="请输入"
            autoSize={{ minRows: 4 }}
          />
        </Form.Item>
      </BaseModal>
    </>
  )
}

/**
 *
 * @param {*} data 报表数据
 * @param {*} mode 模式
 * @returns 校验结果
 */
function checkData (data, mode) {
  const { title, desc, dbName, fieldList } = data

  if (!dbName) {
    message.error('请选择数据源！')
    return false
  }

  const match = title.match(/\w/g)
  const abcLength = match ? match.length : 0
  const length = title.length - abcLength + Math.ceil(abcLength / 2)
  if (length > 15) {
    message.error('标题不能超过15字！')
    return false
  }

  if (desc.length > 0) {
    const match = desc.match(/\w/g)
    const abcLength = match ? match.length : 0
    const length = desc.length - abcLength + Math.ceil(abcLength / 2)
    if (length > 250) {
      message.error('描述不能大于250字！')
      return false
    }
  }

  // DSL模式可以没有字段
  if (mode !== 'DSL' && fieldList.length === 0) {
    message.error('必须添加字段！')
    return false
  }
  return true
}
