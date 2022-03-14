/* eslint-disable eqeqeq */
import { PureComponent, useState, useEffect, useMemo } from 'react'
import moment from 'moment'
import queryString from 'query-string'
import { FrownOutlined, LeftOutlined } from '@ant-design/icons'
import { Spin, message, Modal, Menu, Dropdown } from 'antd'
import Tools from '@/components/layout/Tools'
import TableView from '@/components/TableView'
import Info from '@/components/base/Info'

import usePagination from '@/hooks/usePagination'
import useFetch from '@/hooks/useFetch'
import { getUserReportConfig, getReportData, sendEmail } from '@/services/reportService'

import style from './style.module.less'

export default class Wrap extends PureComponent {
  render () {
    return <Report {...this.props} />
  }
}

function Report (props) {
  // id必须不可变，在外层通过key={id}的方式保证唯一性
  const { id, params, from, isSlot } = props
  const [defaultParams, setDefault] = useState(null)
  const [paramMap, setParamMap] = useState(params || {})
  const [sortor, setSortor] = useState({})
  const [start, setStart] = useState(1)
  const [size, setSize] = useState(10)
  const [layer, setLayer] = useState(null)
  const [drillList, setDrillList] = useState([])

  const [showSearch, setShowSearch] = useState(typeof props.showSearch === 'boolean' ? props.showSearch : true)
  const [modalData, setModalData] = useState(null)

  const [{ data, error }, fetchReportConfig] = useFetch(getUserReportConfig, { data: {} })
  const [preRes, fetchReport] = useFetch(getReportData, { data: {} })
  const [downRes, fetchDown] = useFetch(sendEmail)

  const pagination = usePagination(preRes.data.pageInfo)

  useEffect(() => {
    if (params) {
      setParamMap(params)
    }
  }, [params])

  useEffect(() => {
    const fetch = async () => {
      let map = {}
      if (defaultParams === null) {
        const { paramList } = await fetchReportConfig(id)
        paramList.forEach((item) => {
          const { componentType, paramName, isRange, valDefault } = item
          if (map[paramName]) { return }
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

        setDefault(map)
      } else {
        map = defaultParams
      }

      await fetchReport({
        id,
        paramMap: { ...map, ...paramMap },
        start,
        size,
        layer,
        ...sortor,
      })
    }
    fetch()
  }, [paramMap, sortor, start, size, layer])

  const IndexDescList = useMemo(() => {
    if (!preRes.data.colList) return []
    return preRes.data.colList
      .map(({ colAlias, colDesc }) => {
        return { colAlias, colDesc }
      })
      .filter(item => item.colDesc)
  }, [preRes.data])

  const dataSource = useMemo(() => {
    if (!preRes.data.pageInfo) return []
    return preRes.data.pageInfo.list
  }, [preRes.data])

  const paramList = useMemo(() => {
    return data.paramList ? data.paramList : []
  }, [data.paramList])

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

      // 对话框模式下没有history不能跳转
      if (props.history && data.anchor) {
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
          // data.anchor 为 map 时的逻辑  保留 防止处理不全错误
        } else if (data.anchor[colName]) {
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
      }
    })

    return colList
  }, [preRes.data.colList, data, layer])

  const onClickDesc = () => {
    const content = IndexDescList.map((item) => {
      const { colAlias, colDesc } = item
      return (
        <p key={colAlias}>
          {colAlias}：{colDesc}
        </p>
      )
    })
    Modal.info({
      title: '指标说明',
      content,
      okText: '确认',
    })
  }

  const onDown = async (fileType) => {
    try {
      await fetchDown({ paramMap: paramMap, id, layer, fileType })
      message.success('下载成功，请到阿里云邮箱查看文件！')
    } catch (error) {
      message.error(error)
    }
  }

  const onSearch = (values) => {
    setStart(1)
    setLayer(null)
    setDrillList([])
    setParamMap(values)
  }

  const onReset = () => {
    props.history.replace(`${props.match.url}?id=${id}`)
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

  const onClickCccordion = () => {
    setShowSearch(!showSearch)
  }

  const onDrill = (key, value, row) => {
    const drillItem = data.drill.find(item => item.colName === key)

    const map = { ...defaultParams, ...paramMap }
    drillItem.paramList.forEach((key) => {
      map[key] = typeof row[key] === 'object' ? row[key].value : row[key]
    })

    const field = preRes.data.colList.find(item => item.colName === key)
    const title = field ? (field.colAlias || field.colName) : key

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
        // 参数优先级，行级数据 > 筛选值 > 默认值
        // fix: 跳转时没有默认数据
        if (defaultParams[paramKey] != undefined) {
          params[targetKey] = defaultParams[paramKey]
        }
        if (paramMap[paramKey] != undefined) {
          params[targetKey] = paramMap[paramKey]
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

    if (!props.history) { // 防止嵌套的跳转和弹出对话框
      return false
    }
    const type = resourceType === 'report' ? 'report' : 'dashboard'
    const basePath = isSlot ? '/slot' : '/bi/preview'
    const path = `${basePath}/${type}?id=${resourceId}&params=${JSON.stringify(params)}&from=1`
    if (openMode === 'SELF' || !openMode) {
      props.history.push(path)
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

  const indexDesc = useMemo(() => {
    if (IndexDescList.length === 0) {
      return null
    }
    return <i className="iconfont iconmiaoshu" onClick={onClickDesc} />
  }, [IndexDescList])

  const downloadButton = useMemo(() => {
    const { subSourceAccess } = data
    if (subSourceAccess && subSourceAccess.download !== undefined) {
      if (subSourceAccess.download) {
        const menu = (
          <Menu>
            <Menu.Item><a data-xdlog-async data-xdlog-id="134" onClick={() => onDown('csv')}>下载csv</a></Menu.Item>
            <Menu.Item><a data-xdlog-async data-xdlog-id="134" onClick={() => onDown('excel')}>下载excel</a></Menu.Item>
          </Menu>
        )
        return (
          <Dropdown overlay={menu}>
            <i className="iconfont iconDownload" />
          </Dropdown>
        )
      }
    }
    return null
  }, [data.subSourceAccess, paramMap, id])

  const drill = useMemo(() => {
    const list = drillList.map((item, i) => {
      const { key, title, params } = item

      const isLastItem = i === drillList.length - 1
      return (
        <div key={key} className={style.drillLayerItem} onClick={() => !isLastItem && onDrillGoback(key, params)}>
          <i className={`iconfont iconzuanqu- ${style.drillIcon}`} />
          {isLastItem ? title : <a>{title}</a>}
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
      <span onClick={() => props.history && props.history.goBack()}>
        <LeftOutlined />返回
        &nbsp;
      </span>
    )
  }, [from])

  return (
    <div className={style.report}>
      <Spin spinning={preRes.loading}>
        <Tools>
          {reportGoback}
          <h2 className={style.title}>
            {data.title}
            {data.desc ? <Info data={data.desc} /> : null}
          </h2>
          {drill}
          <Tools.Right>
            <i className="iconfont iconshaixuan-" onClick={onClickCccordion} />
            {indexDesc}
            <Spin spinning={downRes.loading}>
              {downloadButton}
            </Spin>
          </Tools.Right>
        </Tools>
        <TableView
          paramList={paramList}
          paramMap={paramMap}
          colList={colList}
          data={dataSource}
          pagination={pagination}
          showSearch={showSearch}
          onSearch={onSearch}
          onReset={onReset}
          onChange={onChange}
          onDrill={onDrill}
          onAnchor={onAnchor}
          onCustomSorter={onCustomSorter}
        />
      </Spin>
      <Modal
        visible={!!modalData}
        className={style.modal}
        closable={false}
        destroyOnClose
        okText="确认"
        cancelText="取消"
        onOk={() => setModalData(null)}
        onCancel={() => setModalData(null)}
      >
        <Report {...modalData} />
      </Modal>
      {error || preRes.error
        ? <Mask data={{ msg: error || preRes.error }} />
        : null}
    </div>
  )
}

function Mask (props) {
  const { msg } = props.data
  return (
    <div className={style.mask}>
      <FrownOutlined />&nbsp;
      {msg}
    </div>
  )
}
