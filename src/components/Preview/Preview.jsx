/* eslint-disable eqeqeq */
import { useState, useEffect, useMemo } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import moment from 'moment'
import queryString from 'query-string'
import { LeftOutlined, FrownOutlined } from '@ant-design/icons'
import { Button, Spin, message, Input, Modal } from 'antd'
import Tools from '@/components/layout/Tools'
import TableView from '@/components/TableView'
import Chart from '@/components/Chart/chart'

import usePagination from '@/hooks/usePagination'
import useFetch from '@/hooks/useFetch'
import useDebounceFn from '@/hooks/useDebounceFn'
import { getPreviewConfig, getPreview, sendEmail } from '@/services/reportService'

import style from './style.module.less'

export default function Preview (props) {
  const { id, params, from, asModal } = props
  const history = useHistory()
  const location = useLocation()
  const qs = queryString.parse(location.search)
  const [nickName, setNickName] = useState(undefined)
  const [paramMap, setParamMap] = useState(params)
  const [paramList, setParamList] = useState([])
  const [sortor, setSortor] = useState({})
  const [start, setStart] = useState(1)
  const [size, setSize] = useState(10)
  const [testRequestValue, setTestValue] = useState(0)
  const [layer, setLayer] = useState(null)
  const [drillList, setDrillList] = useState([])

  const [modalData, setModalData] = useState(null)

  const [{ data }, fetchReportConfig] = useFetch(getPreviewConfig, { data: {} })
  const [preRes, fetchPreview] = useFetch(getPreview, { data: {} })
  const [downRes, fetchDown] = useFetch(sendEmail)

  const pagination = usePagination(preRes.data.pageInfo)

  useEffect(() => {
    // 当不为 Modal 预览时取 query search 中的versionCode  否则都赋值默认的值:0
    fetchReportConfig(id, nickName, !asModal && qs.versionCode)
  }, [id, asModal, testRequestValue])

  useEffect(() => {
    setParamMap(params)
  }, [params])

  useDebounceFn(() => {
    if (data.id) {
      const map = { ...paramMap }
      data.paramList.forEach((item) => {
        const { componentType, paramName, isRange, valDefault } = item
        if (map[paramName] || map[paramName] === 0) { return }
        if (!valDefault) { return }
        map[paramName] = valDefault

        if (componentType.includes('DATE')) {
          if (isRange) {
            const [start, end] = valDefault
            const list = []
            list.push(moment(start).format('YYYYMMDD'))
            list.push(moment(end).format('YYYYMMDD'))
            map[paramName] = list
          } else {
            map[paramName] = moment(valDefault).format('YYYYMMDD')
          }
        }
      })

      const pageSize = data.defaultReportType === 'TABLE' ? size : 1000
      // 处理URL参数为数值筛选器的情况
      Object.keys(paramMap).forEach((key) => {
        const val = data.paramList.find(item => item.paramName === key)
        if (val && val.isRange && val.componentType.includes('NUMBER')) {
          const v = map[key]
          map[key] = Array.isArray(v) ? v : [v, v]
        }
      })

      fetchPreview({
        id: id,
        versionCode: asModal ? '0' : (qs.versionCode || '0'),
        paramMap: map,
        nickName,
        start,
        size: pageSize,
        layer,
        ...sortor,
      })
    }
  }, [data.id, paramMap, sortor, start, size, testRequestValue, layer, params])

  useEffect(() => {
    setParamList(data.paramList || [])
  }, [data.paramList])

  const dataSource = useMemo(() => {
    if (!preRes.data.pageInfo) return []
    return preRes.data.pageInfo.list
  }, [preRes.data])

  const colList = useMemo(() => {
    const { colList } = preRes.data
    if (!colList) {
      return []
    }
    if (Object.keys(data).length === 0) {
      return []
    }

    colList.forEach((item) => {
      // DSL 创建报表时 手写的sql 给字段取了别名，导致匹配不上，后端多返回的colSchemaName字段是这个字段对应表的字段名
      const { colName, colSchemaName } = item
      const colNames = [colName, colSchemaName]
      const hasDrill = !!data.drill.find(item => colNames.indexOf(item.colName) >= 0)
      const length = data.drill.length
      if (layer === null) {
        if (hasDrill && length > 1) {
          item.isDrill = true
        }
      } else if (layer && hasDrill && colNames.indexOf(data.drill[length - 1].colName) === -1) {
        item.isDrill = true
      }
      // 对层级筛选最后一层做处理，层级最后一层是bd，一般情况下不会有变
      if (paramMap['#hierarchy#'] === 'BD') {
        item.isDrill = false
      }

      // data.anchor 为数组 代表 1vn
      if (Array.isArray(data.anchor)) {
        const anchorList = data.anchor.filter(val => colNames.indexOf(val.fromParam) >= 0)
        const _anchorList = []
        for (const _anchor of anchorList) {
          if (_anchor.layer === 'ALL_LAYER') {
            _anchorList.push(_anchor)
          } else {
            const item1 = data.drill.find((item, i) => item.colName === _anchor.layer)
            const item2 = data.drill.find((item, i) => item.colName === layer)
            if (data.drill.indexOf(item1) - data.drill.indexOf(item2) === 1) {
              // layer的值是 null -> layer1 -> layerN
              // 所以跳转字段作用域正好是当前layer的下一个
              _anchorList.push(_anchor)
            }
          }
        }
        _anchorList.length && (item.anchor = _anchorList)
        // 保留原来的逻辑  以免没有处理全报错
      } else if (data.anchor && data.anchor[colName]) {
        const anchor = data.anchor[colName]
        if (anchor.layer === 'ALL_LAYER') {
          item.anchor = data.anchor[colName]
        } else {
          const item1 = data.drill.find((item, i) => item.colName === anchor.layer)
          const item2 = data.drill.find((item, i) => item.colName === layer)
          if (data.drill.indexOf(item1) - data.drill.indexOf(item2) === 1) {
            // layer的值是 null -> layer1 -> layerN
            // 所以跳转字段作用域正好是当前layer的下一个
            item.anchor = data.anchor[colName]
          }
        }
      }
    })

    return colList
  }, [preRes.data.colList, data, layer])

  const onDown = async () => {
    try {
      await fetchDown({ paramMap: paramMap, id, layer })
      message.success('下载成功，请到阿里云邮箱查看文件！')
    } catch (error) {
      message.error(error)
    }
  }

  const onSearch = (values) => {
    setLayer(null)
    setDrillList([])
    setParamMap(values)
  }

  const onReset = () => {
    history.replace(`${props.match.url}?id=${id}`)
  }

  const onChange = (pagination, filters, sorter) => {
    const { current, pageSize } = pagination
    const { field, order } = sorter
    // 当为自定义排序 分页触发change时 order=false 此时应该保留自定义的 sortor
    if (order !== false) {
      setSortor({
        sortField: field,
        sortMethod: order ? order.replace('end', '') : undefined,
      })
    }
    setStart(current)
    setSize(pageSize)
  }

  const onCustomSorter = (sorter) => {
    setSortor(sorter)
  }

  const onDrill = (key, value, row) => {
    const drillItem = data.drill.find(item => item.colName === key)

    const map = { ...paramMap }
    drillItem.paramList.forEach((key) => {
      map[key] = typeof row[key] === 'object' ? row[key].value : row[key]
    })

    const field = preRes.data.colList.find(item => item.colName === key)
    const title = field ? field.colAlias : key

    setLayer(key)
    setDrillList([...drillList, { key, value, title, params: map }])
    setParamMap(map)
  }

  const onAnchor = (key, row, option) => {
    const { resourceType, resourceId, openMode, targetURL, customParam } = option
    const params = {}
    if (option.paramMap) {
      Object.keys(option.paramMap).forEach((paramKey) => {
        const targetKey = option.paramMap[paramKey]
        /**
         * 同上面colList里面 “DSL 创建报表时 手写的sql 给字段取了别名，导致匹配不上，后端多返回的colSchemaName字段是这个字段对应表的字段名”
         * 传递的参数同样会出现别名匹配不上的问题
         * 所以遍历传递的参数的同时 需要在 colList 里面找到对应的别名和字段名 以便在列表项传值时进行匹配
           anchor: [
            {
              fromParam: "quotation_id"
              paramMap: {quotation_id: "powerbank_no"}
            }
           ]

           colList: [
            {
              colName: "测算申请id"
              colSchemaName: "quotation_id"
            }
           ]

            list: [
              {
                测算申请id: 10000030
              }
            ]
         */
        const colName = colList.find(item => item.colSchemaName === paramKey)?.colName
        const value = row[paramKey] === undefined && colName ? row[colName] : row[paramKey]
        if (paramMap[paramKey] != undefined) {
          params[targetKey] = paramMap[paramKey].toString()
        }
        if (value != undefined) {
          params[targetKey] = typeof value === 'object' ? value.value : value.toString()
        }
      })
    }

    // 个性化设置的参数处理
    if (customParam) {
      params[customParam] = ''
    }

    if (targetURL) {
      const url = new URL(targetURL)
      const arg = {
        ...queryString.parse(url.search),
        ...params,
      }
      const href = `${url.origin}${url.pathname}?${queryString.stringify(arg)}`

      if (openMode === 'SELF' || !openMode) {
        window.location.href = href
      } else if (openMode === 'BLANK') {
        window.open(href, '_blank')
      } else if (openMode === 'MODAL') {
        window.location.href = href
      }
      return
    }

    const modalData = {
      id: resourceId,
      params,
    }
    const type = resourceType === 'report' ? 'preview' : 'dashboard'
    const path = `/bi/${type}?id=${resourceId}&params=${JSON.stringify(params)}&from=1`
    if (openMode === 'SELF' || !openMode) {
      history.push(path)
    } else if (openMode === 'BLANK') {
      window.open(window.location.origin + path, '_blank')
    } else if (openMode === 'MODAL') {
      setModalData(modalData)
    }
  }

  const onDrillGoback = (key, params) => {
    let list = [...drillList]
    const drill = list.find(item => item.key === key)
    const index = drillList.indexOf(drill)
    if (index === -1) {
      list = []
    } else {
      list.splice(index + 1)
    }
    setDrillList(list)
    setLayer(key)

    // 回溯到顶层后，应该保留筛选中的数据
    if (params === null) {
      const drillKeyList = []
      data.drill.forEach((item) => {
        drillKeyList.push.apply(drillKeyList, item.paramList)
      })
      const map = {}
      Object.keys(paramMap).forEach((key) => {
        if (drillKeyList.indexOf(key) > -1) {
          return
        }
        map[key] = paramMap[key]
      })
      setParamMap(map)
    } else {
      setParamMap(params)
    }
  }

  const permission = useMemo(() => {
    let child = null
    if (data.dataPermission) {
      child = (
        <Tools.Right>
          <span>数据权限验证开启：</span>
          <Input placeholder="输入测试花名" onChange={e => setNickName(e.target.value)} />
          <Button onClick={() => setTestValue(Date.now())}>验证</Button>
        </Tools.Right>
      )
    }
    return (
      <Tools className={style.permission}>
        <Button
          icon={<LeftOutlined />}
          onClick={() => {
            const searchArr = []
            qs.groupId && searchArr.push(`groupId=${qs.groupId}`)
            qs.bizType && searchArr.push(`bizType=${qs.bizType}`)
            history.push(`/bi/list${searchArr.length ? `?${searchArr.join('&')}` : ''}`)
          }}
        >
          返回
        </Button>
        {child}
      </Tools>
    )
  }, [data.dataPermission, history])

  const drill = useMemo(() => {
    const list = drillList.map((item, i) => {
      const { key, title, params } = item

      const isLastItem = i === drillList.length - 1
      const titleVal = `${title}(${params[key]})`
      return (
        <div key={key} className={style.drillLayerItem} onClick={() => !isLastItem && onDrillGoback(key, params)}>
          <i className={`iconfont iconzuanqu- ${style.drillIcon}`} />
          {isLastItem ? titleVal : <a>{titleVal}</a>}
        </div>
      )
    })

    if (list.length > 0) {
      return (
        <div className={style.drillWrap}>
          <div className={style.drillLayerItem} onClick={() => onDrillGoback(null, null)}>
            <a>回到顶层</a>
          </div>
          {list}
        </div>
      )
    }
    return null
  }, [drillList])

  // 这个是从别的报表跳转过来后显示的返回按钮
  const reportGoback = useMemo(() => {
    if (!from) { return null }
    return (
      <span onClick={() => history.goBack()}>
        <LeftOutlined />返回
        &nbsp;
      </span>
    )
  }, [from])

  return (
    <Spin spinning={preRes.loading}>
      {permission}
      <Tools>
        {reportGoback}
        <h1 className={style.title}>
          {data.title}
        </h1>
        {drill}
        <Tools.Right>
          <Spin spinning={downRes.loading}>
            <Button onClick={onDown}>下载</Button>
          </Spin>
        </Tools.Right>
      </Tools>
      <div className={style.desc}>描述：{data.desc}</div>
      {
        preRes?.error
          ? <div className={style.mask}>
            <FrownOutlined />&nbsp;
            {preRes?.error}
          </div>
          : (data.defaultReportType === 'TABLE'
            ? (
              <TableView
                paramList={paramList}
                paramMap={paramMap}
                colList={colList}
                data={dataSource}
                config={data}
                pagination={pagination}
                onSearch={onSearch}
                onReset={onReset}
                onChange={onChange}
                onDrill={onDrill}
                onAnchor={onAnchor}
                onCustomSorter={onCustomSorter}
              />)
            : (
              !!colList.length && data && (
                <Chart
                  paramList={paramList}
                  paramMap={paramMap}
                  colList={colList}
                  data={dataSource}
                  chartProps={data.props}
                  xAxis={preRes.data.xAxis}
                  yAxis={preRes.data.yAxis}
                  pagination={pagination}
                  defaultReportType={data.defaultReportType}
                  onSearch={onSearch}
                  onReset={onReset}
                  onChange={onChange}
                  onDrill={onDrill}
                  onAnchor={onAnchor}
                />
              )
            )
          )
      }

      <Modal
        visible={!!modalData}
        className={style.modal}
        closable={false}
        destroyOnClose
        onOk={() => setModalData(null)}
        onCancel={() => setModalData(null)}
      >
        <Preview {...modalData} asModal={!!modalData} />
      </Modal>
    </Spin>
  )
}
