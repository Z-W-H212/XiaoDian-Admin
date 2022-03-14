import _ from 'lodash'

const initState = {
  error: null,
  filterHandleList: [],
  componentMap: {},
  refTargetMap: {},
}

const reducer = {
  init (state) {
    return { ...state, ...initState }
  },

  initFilter (state, payload) {
    const filterHandleList = []
    const componentMap = {}
    const refTargetMap = {}

    payload.filterList.forEach((item) => {
      const { paramName, label, refParamMap } = item
      filterHandleList.push({ id: paramName, title: label })

      componentMap[paramName] = { ...item }
      refTargetMap[paramName] = refParamMap
    })

    return { ...state, filterHandleList, componentMap, refTargetMap }
  },

  // 添加筛选器的时候做初始化处理
  addFilterHandle (state, payload) {
    const filterHandleList = [...state.filterHandleList]
    const componentMap = { ...state.componentMap }
    const refTargetMap = { ...state.refTargetMap }

    const id = Date.now()
    filterHandleList.push({ title: '全局筛选器', id })

    componentMap[id] = {
      componentType: 'INPUT',
      dataType: 'STRING',
    }

    refTargetMap[id] = {}

    return { ...state, filterHandleList, componentMap, refTargetMap }
  },

  // componentMap中，无效引用数据会一直缓存在内存中，直到组件卸载
  delFilterHandle (state, payload) {
    const { id, fieldList } = payload

    const filterHandleList = fieldList.filterHandleList.filter(item => item.id !== id)
    const list = _.differenceBy(fieldList, filterHandleList, 'value')

    return { ...state, fieldList: list, filterHandleList }
  },

  setFilterHandleList (state, payload) {
    const { filterHandleList } = payload
    return { ...state, filterHandleList }
  },

  setComponentData (state, payload) {
    const { id, data } = payload
    const componentMap = { ...state.componentMap }
    componentMap[id] = data

    return { ...state, componentMap }
  },

  setRefTargetMap (state, payload) {
    const { refTargetMap } = payload

    return { ...state, refTargetMap }
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
    throw new Error(`Unknown action ${type}`)
  },
}
