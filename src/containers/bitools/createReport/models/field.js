import formatTagName from '@/utils/format-tag-name'
import { message } from 'antd'

const drillPrefixMap = ['cd_dep_', 'dm_dep_', 'lm_dep_', 'cm_dep_', 'bdm_dep_', 'bd_', 'org_', '#organization#']

const initState = {
  error: null,

  selected: null,
  dbName: '',
  tableName: '',
  fieldList: [],
  organization: [],
  defaultReportType: 'TABLE', // TABLE, LIN, BAR, PIE, RADAR 图表类型

  title: '',
  desc: '',
  code: '',
  drillMap: {}, // 钻取
  dsl: '', // 只有sql编辑模式下才会使用
  dimensionMap: {},
  indexMap: {},
  permission: 0,
  cityPermission: '', // 城市权限
  isLov: false,
  nickName: '',
  defaultSortKey: '',
  defaultSort: '',
  sortList: [],
  paramMap: {}, // 数据源数据
  previewData: {}, // 预览数据
  xAxis: [],
  yAxis: [],
  mode: 0,
  tag: '',
  props: {
    other: {
      color: '',
      series: '',
    },
    style: {
      showGraphTag: false,
      showMap: true,
      showGridlines: false,
      showAbbreAxis: false,
      mapPosition: 'TOP',
    },
    xAxisProp: {
      showAxis: true,
      showTag: true,
      showTitle: true,
      title: '',
    },
    yAxisPriProp: {
      showAxis: true,
      showTag: true,
      showTitle: true,
      title: '',
    },
  },

  anchorList: [],
  panelActivedKey: '1|', // 预览结果tab默认
  unavailableReason: {},
  downloadMaxLimit: 100000,
}

const reducer = {
  init (state, payload) {
    return { ...state, ...initState }
  },

  clearError (state, payload) {
    return { ...state, error: null }
  },

  reset (state, payload) {
    const {
      dbName, dataSetName, title, desc, code, mode, dsl, tag,
      dataPermission, authType, isLov, defaultSort, defaultSortKey,
      fieldList, paramList, drill, anchor, defaultReportType, props,
      cacheStrategy,
    } = payload
    const dimensionMap = {}
    const indexMap = {}
    const sortList = []
    const xAxis = []
    const yAxis = []

    fieldList.forEach((item) => {
      const { colName, colAlias, type, sort, aggregate } = item
      if (sort) {
        sortList.push(`${colName}&${type}`)
      }
      // Don't know why
      if (item._source !== 'parse') {
        if (type === 'dimension') {
          dimensionMap[colName] = item
          xAxis.push(colName)
        } else if (type === 'index') {
          indexMap[colName] = item
          const alias = colAlias || colName
          indexMap[colName].colAlias = alias
          yAxis.push(mode === 0 ? `${colName}_${aggregate}` : colName)
        }
      }
    })

    const paramMap = { ...state.paramMap }
    paramList.forEach((item) => {
      const { paramName, label } = item
      paramMap[paramName] = {
        ...item,
        colName: paramName,
        colAlias: label,
        checked: true,
      }
    })

    const drillMap = {}
    drill.forEach((item, i) => {
      const { colName } = item
      drillMap[colName] = { ...item, sequence: i }
    })

    let newState = {
      ...state,
      mode,
      dbName,
      tableName: dataSetName,
      title,
      desc,
      code,
      dsl,
      tag,
      defaultReportType,
      permission: dataPermission,
      cityPermission: authType,
      isLov,
      defaultSort,
      defaultSortKey,
      sortList,
      dimensionMap,
      indexMap,
      paramMap,
      drillMap,
      props,
      xAxis,
      yAxis,
      anchorList: anchor,
      cacheStrategy,
    }

    if (mode) {
      newState.fieldList = fieldList
      newState = this.setParamKeyList(newState, { fieldList })
    }

    return newState
  },

  setSelectDBInfo (state, payload) {
    const { dbName, tableName } = payload
    return { ...state, dbName, tableName }
  },

  setParamKeyList (state, payload) {
    const { fieldList, hasHierarchy } = payload
    // map的非数字字段顺序是根据添加先后顺序决定的
    const paramMap = {}
    if (hasHierarchy) {
      const colName = '#hierarchy#'
      paramMap[colName] = {
        checked: false,
        colAlias: '部门层级筛选',
        colName,
      }
    }
    Object.assign(paramMap, state.paramMap)

    fieldList.forEach((item) => {
      const { colName } = item
      if (!paramMap[colName]) {
        paramMap[colName] = { ...item, checked: false }
      } else {
        paramMap[colName] = { ...paramMap[colName], ...item }
      }
    })

    return { ...state, paramMap }
  },

  delParamKey (state, payload) {
    const { colName } = payload
    const paramMap = {}
    Object.keys(state.paramMap).forEach((key) => {
      if (key === colName) {
        return false
      }
      paramMap[key] = state.paramMap[key]
    })

    return { ...state, paramMap }
  },

  setFieldList (state, payload) {
    const { fieldList } = payload
    const dimensionMap = { ...state.dimensionMap }
    const indexMap = { ...state.indexMap }
    const paramMap = { ...state.paramMap }

    fieldList.forEach((item) => {
      const { colName, colAlias, colType, _source } = item
      if (dimensionMap[colName]) {
        dimensionMap[colName] = {
          ...dimensionMap[colName],
          ...item,
        }
      }
      if (indexMap[colName]) {
        indexMap[colName] = {
          ...indexMap[colName],
          ...item,
        }
        indexMap[colName].colAlias = colAlias
        indexMap[colName].colType = colType
        indexMap[colName]._source = _source
      }
      if (paramMap[colName]) {
        const params = { ...paramMap[colName], label: formatTagName(item), dataType: colType }
        paramMap[colName] = params
      }
    })

    return { ...state, fieldList, dimensionMap, indexMap, paramMap }
  },

  setOrganization (state, payload) {
    const { organization } = payload
    organization.forEach((item) => {
      if (!item.colAlias) {
        item.colAlias = item.colName
      }
    })
    return { ...state, organization }
  },

  selectTarget (state, payload) {
    const { targetType, colName } = payload
    return { ...state, selected: { targetType, colName } }
  },

  // 只有在创建DSL时，初始化使用，传入fieldList，会导致Dimension全量重建
  initialDimension (state, payload) {
    const { fieldList } = payload
    const dimensionMap = {}
    fieldList.forEach((item) => {
      const { colName, type } = item
      if (type === 'dimension') {
        dimensionMap[colName] = item
      }
    })

    return { ...state, dimensionMap }
  },

  copyDimension (state, payload) {
    const { colName, colAlias, colType, colDesc, tagName, tagAlias, tagTimePeriod, tagRemark } = payload
    if (state.dimensionMap[colName] || state.indexMap[colName]) {
      return { ...state, error: new Error('不能重复添加字段') }
    }

    const dimensionMap = { ...state.dimensionMap }
    const sequence = Object.keys(state.dimensionMap).length
    dimensionMap[colName] = {
      colName,
      colAlias: colAlias || colName,
      colType,
      colDesc,
      tagName,
      tagAlias,
      tagTimePeriod,
      tagRemark,
      type: 'dimension',
      sequence,
      width: 150,
    }

    let newState = state
    if (colName === '#organization#') {
      newState = this.addDrill(state, { colName })
    }

    const xAxis = [...state.xAxis, colName]

    return { ...newState, xAxis, dimensionMap }
  },

  closeDimension (state, payload) {
    const { colName } = payload
    const dimensionMap = { ...state.dimensionMap }
    const { sequence } = dimensionMap[colName]
    delete dimensionMap[colName]

    Object.keys(dimensionMap).forEach((key) => {
      const item = dimensionMap[key]
      if (item.sequence > sequence) {
        dimensionMap[key] = { ...item, sequence: item.sequence - 1 }
      }
    })

    const fieldList = state.fieldList.map(e => (e.colName === colName ? ({ ...e, type: '' }) : e))

    let sortList = state.sortList
    const index = sortList.indexOf(`${colName}&dimension`)
    if (index > -1) {
      sortList = [...sortList]
      sortList.splice(index, 1)
    }

    let newState = state
    // 删除下钻数据  如果是第一个下钻则删除全部
    if (newState.drillMap[colName] && newState.drillMap[colName].sequence === 0) {
      newState.drillMap = {}
      // 组织架构的同步删除
    } else if (colName === '#organization#') {
      newState = this.delDrill(newState, { colName })
    }

    const xAxis = state.xAxis.filter((e) => {
      if (colName === '#organization#') {
        return !drillPrefixMap.find(i => e.indexOf(i) > -1)
      }
      return e !== colName
    })

    return { ...newState, xAxis, fieldList, dimensionMap, sortList, selected: null }
  },

  copyIndex (state, payload) {
    const { colName, colAlias, colType, colDesc, tagName, tagAlias, tagTimePeriod, tagRemark, isNumber } = payload
    if (state.dimensionMap[colName] || state.indexMap[colName]) {
      return { ...state, error: new Error('不能重复添加字段') }
    }

    const indexMap = { ...state.indexMap }
    const sequence = Object.keys(indexMap).length
    const aggregate = isNumber ? 'sum' : 'count' // default sum, count avg distinct max min
    indexMap[colName] = {
      colName,
      colAlias: colAlias || colName,
      colType,
      colDesc,
      tagName,
      tagAlias,
      tagTimePeriod,
      tagRemark,
      isNumber,
      type: 'index',
      aggregate,
      sequence,
      width: '150',
    }
    const yAxis = [...state.yAxis, state.mode === 0 ? `${colName}_${aggregate}` : colName]
    return { ...state, yAxis, indexMap }
  },

  // 更新指标数据
  updateIndexMap (state, payload) {
    let newState = state
    const indexMap = {}
    const yAxis = []

    payload.forEach((item, i) => {
      const colName = item.key || item.colName
      const currentItem = state.indexMap[colName]
      let aggregate

      // 当前区域拖动
      if (currentItem) {
        indexMap[colName] = {
          ...currentItem,
          sequence: i,
        }
        aggregate = currentItem.isNumber ? 'sum' : 'count'
      // 从字段列表拖动进入指标区域
      } else {
        let targetItem = item
        // 从维度区域拖动进入指标区域
        if (!item.colName) {
          targetItem = state.fieldList.find(val => val.colName === colName) || item
          // 删除下钻数据  如果是第一个下钻则删除全部
          if (newState.drillMap[colName] && newState.drillMap[colName].sequence === 0) {
            newState.drillMap = {}
            // 组织架构的同步删除
          } else if (colName === '#organization#') {
            newState = this.delDrill(newState, { colName })
          }
        } else if (colName === '#organization#') {
          newState = this.addDrill(state, { colName })
        }

        const { colAlias, colType, colDesc, tagName, tagAlias, tagTimePeriod, tagRemark, tagId, isNumber } = targetItem
        aggregate = isNumber ? 'sum' : 'count' // default sum, count avg distinct max min
        indexMap[colName] = {
          colName,
          colAlias: colAlias || colName,
          colType,
          colDesc,
          tagName,
          tagAlias,
          tagTimePeriod,
          tagRemark,
          tagId,
          isNumber,
          type: 'index',
          aggregate,
          sequence: i,
          width: 150,
        }
      }
      yAxis.push(state.mode === 0 ? `${colName}_${aggregate}` : colName)
    })

    return { ...newState, indexMap, yAxis }
  },

  // 更新纬度数据
  updateDimensionMap (state, payload) {
    const dimensionMap = {}
    const xAxis = []

    let newState = state

    payload.forEach((item, i) => {
      const colName = item.key || item.colName
      const currentItem = state.dimensionMap[colName]

      // 当前区域移动 改变顺序
      if (currentItem) {
        dimensionMap[colName] = {
          ...currentItem,
          sequence: i,
        }
      // 从字段列表拖动进入纬度区域
      } else {
        let targetItem = item
        // 从指标区域中拖动进入纬度区域
        if (!item.colName) {
          targetItem = state.fieldList.find(val => val.colName === colName) || item
        }
        const { colAlias, colType, colDesc, tagName, tagAlias, tagTimePeriod, tagRemark, tagId } = targetItem
        dimensionMap[colName] = {
          colName,
          colAlias: colAlias || colName,
          colType,
          colDesc,
          tagName,
          tagAlias,
          tagTimePeriod,
          tagRemark,
          tagId,
          type: 'dimension',
          width: 150,
          sequence: i,
        }

        if (colName === '#organization#') {
          newState = this.addDrill(state, { colName })
        }
      }

      xAxis.push(colName)
    })

    return { ...newState, dimensionMap, xAxis }
  },

  updateDrillMap (state, payload) {
    const drillMap = {}

    payload.forEach((item, i) => {
      const colName = item.key || item.colName

      const anchorItem = state.anchorList.find(val => val.fromParam === colName)
      if (anchorItem) {
        message.error('已设置跳转字段不能下钻')
        return state
      }

      drillMap[colName] = {
        colName,
        sequence: i,
        paramList: [colName],
      }
    })

    return { ...state, drillMap }
  },

  closeIndex (state, payload) {
    const { colName } = payload
    const indexMap = { ...state.indexMap }
    const { sequence } = indexMap[colName]
    delete indexMap[colName]

    const fieldList = state.fieldList.map(e => (e.colName === colName ? ({ ...e, type: '' }) : e))

    Object.keys(indexMap).forEach((key) => {
      const item = indexMap[key]
      if (item.sequence > sequence) {
        indexMap[key] = { ...item, sequence: (item.sequence - 1).toString() }
      }
    })

    let sortList = state.sortList
    const index = sortList.indexOf(`${colName}&index`)
    if (index > -1) {
      sortList = [...sortList]
      sortList.splice(index, 1)
    }

    const { aggregate } = state.indexMap[colName]
    const find = state.yAxis.findIndex(e => e === (state.mode === 0 ? `${colName}_${aggregate}` : colName))
    const yAxis = [...state.yAxis.slice(0, find), ...state.yAxis.slice(find + 1)]
    return { ...state, yAxis, indexMap, sortList, fieldList, selected: null }
  },

  changeIndexAggregate (state, payload) {
    const { colName, value } = payload
    const indexMap = { ...state.indexMap }

    indexMap[colName] = {
      ...state.indexMap[colName],
      aggregate: value,
      colAlias: state.indexMap[colName].colAlias,
    }
    const { aggregate } = state.indexMap[colName]
    const find = state.yAxis.findIndex(e => e === (aggregate ? `${colName}_${aggregate}` : colName))
    const yAxis = [...state.yAxis.slice(0, find), `${colName}_${value}`, ...state.yAxis.slice(find + 1)]

    return { ...state, yAxis, indexMap }
  },

  changeIndexIfCalSamePeriodCompare (state, payload) {
    const { colName, value } = payload
    const indexMap = { ...state.indexMap }

    indexMap[colName] = {
      ...state.indexMap[colName],
      ifCalSamePeriodCompare: value,
    }

    return { ...state, indexMap }
  },
  changeIndexNumberFormat (state, payload) {
    const { colName, ...value } = payload
    const indexMap = { ...state.indexMap }

    indexMap[colName] = {
      ...state.indexMap[colName],
      ...value,
    }

    return { ...state, indexMap }
  },

  moveDimension (state, payload) {
    const { data } = payload

    const dimensionMap = { ...state.dimensionMap }
    data.forEach((key, i) => {
      const item = { ...dimensionMap[key] }
      item.sequence = i
      dimensionMap[key] = item
    })

    return { ...state, dimensionMap }
  },

  moveIndex (state, payload) {
    const { data } = payload

    const indexMap = { ...state.indexMap }
    data.forEach((key, i) => {
      const item = { ...indexMap[key] }
      item.sequence = i
      indexMap[key] = item
    })

    return { ...state, indexMap }
  },

  moveTarget (state, payload) { // 某个标签改变位置后，新老位置之间的标签也要改变sequence
    const { type, colName, sequence } = payload
    const dimensionMap = { ...state.dimensionMap }
    const indexMap = { ...state.indexMap }
    const dataMap = type === 'index' ? indexMap : dimensionMap

    const prevSequece = dataMap[colName].sequence

    if (+prevSequece === +sequence) { return state }

    Object.keys(dataMap).forEach((key) => {
      const data = { ...dataMap[key] }
      if (colName === key) {
        data.sequence = sequence
        dataMap[key] = data
        return
      }
      if (prevSequece > sequence) {
        if (data.sequence >= sequence && data.sequence < prevSequece) {
          data.sequence = +data.sequence + 1
        }
      } else {
        if (data.sequence <= sequence && data.sequence > prevSequece) {
          data.sequence = data.sequence - 1
        }
      }
      dataMap[key] = data
    })

    const newState = { ...state }
    if (type === 'index') {
      newState.indexMap = dataMap
    } else if (type === 'dimension') {
      newState.dimensionMap = dataMap
    }
    return newState
  },

  setMode (state, payload) {
    const { mode } = payload
    return { ...state, mode }
  },

  setDownCount (state, payload) {
    const { downloadMaxLimit } = payload

    return { ...state, downloadMaxLimit }
  },

  setTitle (state, payload) {
    const { title } = payload
    return { ...state, title }
  },

  setDesc (state, payload) {
    const { desc } = payload
    return { ...state, desc }
  },

  setCode (state, payload) {
    const { code } = payload
    return { ...state, code }
  },

  setDsl (state, payload) {
    const { dsl } = payload
    return { ...state, dsl }
  },

  setPermission (state, payload) {
    const { permission, nickName } = payload
    return { ...state, permission, nickName }
  },

  setCityPermission (state, payload) {
    const { cityPermission, nickName } = payload
    return { ...state, cityPermission, nickName }
  },

  setReportType (state, payload) {
    const { defaultReportType } = payload
    return { ...state, defaultReportType }
  },

  setChartOtherProps (state, payload) { },
  setChartXAxisProps (state, payload) {
    const { xAxisProp } = payload
    return { ...state, props: { ...state.props, xAxisProp } }
  },
  setChartYAxisProps (state, payload) {
    const { yAxisPriProp } = payload
    return { ...state, props: { ...state.props, yAxisPriProp } }
  },
  setChartStyleProps (state, payload) {
    const { style } = payload
    return { ...state, props: { ...state.props, style } }
  },

  setIsLov (state, payload) {
    const { isLov } = payload
    return { ...state, isLov }
  },

  setSort (state, payload) {
    const { sortList, defaultSort, defaultSortKey } = payload
    return { ...state, sortList, defaultSort, defaultSortKey }
  },

  setParamMap (state, payload) {
    const { paramMap } = payload
    const map = {}
    Object.keys(state.paramMap).forEach((key) => {
      if (paramMap[key]) {
        map[key] = paramMap[key]
        return
      }
      map[key] = { ...state.paramMap[key] }
      map[key].checked = false
    })
    Object.keys(paramMap).forEach((key) => {
      if (paramMap[key].dataType === 'SPECIAL') {
        map[key] = paramMap[key]
      }
    })
    return { ...state, paramMap: map }
  },

  moveParams (state, payload) {
    const { keyList } = payload
    const paramMap = { ...state.paramMap }
    keyList.forEach((key, i) => {
      paramMap[key].sequence = i
    })
    return { ...state, paramMap }
  },

  setPreviewData (state, payload) {
    const { previewData } = payload
    return { ...state, previewData, xAxis: previewData.xAxis, yAxis: previewData.yAxis }
  },

  addDrill (state, payload) {
    const { colName, tagName } = payload
    const drillMap = { ...state.drillMap }
    const name = tagName || colName
    if (drillMap[name]) {
      message.error(`${name} -> 不能重复添加`)
      return state
    }

    for (const item of state.anchorList) {
      if (item.fromParam === name) {
        message.error('已设置跳转字段不能下钻')
        return state
      }
    }

    drillMap[name] = {
      colName: name,
      sequence: Object.keys(drillMap).length,
      paramList: [name],
    }

    return { ...state, drillMap }
  },

  delDrill (state, payload) {
    const { colName } = payload
    const drillMap = {}

    const fieldList = state.fieldList.map(e => (e.colName === colName ? ({ ...e, type: '' }) : e))
    Object.keys(state.drillMap).forEach((key) => {
      const item = state.drillMap[key]
      if (item.colName === colName) { return }
      drillMap[key] = state.drillMap[key]
    })

    return { ...state, fieldList, drillMap }
  },

  moveDrill (state, payload) {
    const { list } = payload
    const { drillMap } = state
    list.forEach((key, i) => {
      drillMap[key].sequence = i
    })
    return { ...state, drillMap }
  },

  setAnchor (state, payload) {
    const { anchorList } = payload

    return { ...state, anchorList }
  },

  setPanelActivedKey (state, payload) {
    const { panelActivedKey } = payload
    return { ...state, panelActivedKey }
  },

  delAnchor (state, payload) {
    const { colName } = payload
    const anchorList = []
    state.anchorList.forEach((item) => {
      item.fromParam !== colName && anchorList.push(item)
    })

    return { ...state, anchorList }
  },

  setTag (state, payload) {
    return { ...state, tag: payload }
  },

  setUnavailableReason (state, payload) {
    return { ...state, unavailableReason: payload }
  },

  setCacheStrategy (state, payload) {
    const cacheStrategy = { ...payload.cacheStrategy }
    const { timeUnit, value } = cacheStrategy
    const curVal = state.cacheStrategy?.value

    if ((!timeUnit || timeUnit === 'SECONDS') && value > 300) {
      cacheStrategy.value = 300
    } else if (timeUnit === 'MINUTES' && value > 5) {
      cacheStrategy.value = 5
    } else if (isNaN(value)) {
      cacheStrategy.value = curVal
    }
    return { ...state, cacheStrategy }
  },
}

export default {
  state: {
    ...initState,
  },
  reducer (state, action) {
    const { type, payload } = action
    if (reducer[type]) {
      return reducer[type](state, payload)
    }
    throw new Error()
  },
}
