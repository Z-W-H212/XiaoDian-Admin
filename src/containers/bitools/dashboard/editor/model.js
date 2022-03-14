const initState = {
  error: null,
  title: '',
  desc: '',
  maxResourceLength: 20, // 最大资源数量
  reportList: [],
  reportConfigMap: {},
  blockMap: {}, // [ [id]: { sequence, resourceId, width }]
  filterMap: {},
  filterList: [],
}

const reducer = {
  init (state) {
    return { ...state, ...initState }
  },

  initDashboard (state, payload) {
    const { title, desc, list, paramList } = payload
    const theState = this.initBlocks(state, { list })

    return { ...theState, title, desc, filterList: paramList }
  },

  initBlocks (state, payload = {}) {
    const { list } = payload

    const blockMap = {}
    for (let i = 0; i < state.maxResourceLength; i++) {
      blockMap[i] = {
        sequence: i,
        width: 50,
        height: 0,
      }
    }
    if (list) {
      list.forEach((item) => {
        const { id, sequence, width } = item
        if (sequence == null) { // 有脏数据没有sequence，猜测是老的仪表盘产生的
          return false
        }
        blockMap[sequence] = { ...blockMap[sequence], id, width }
      })

      list.forEach((item) => {
        const { id, width, sequence } = item
        if (sequence != null) {
          return false
        }
        const key = Object.keys(blockMap).find((key) => {
          return !blockMap[key].id
        })
        if (key !== undefined) {
          blockMap[key] = { ...blockMap[key], id, width }
        }
      })
    }

    return { ...state, blockMap }
  },

  setTitle (state, payload) {
    const { title } = payload
    return { ...state, title }
  },

  setDesc (state, payload) {
    const { desc } = payload
    return { ...state, desc }
  },

  setReportList (state, payload) {
    const { data } = payload

    return { ...state, reportList: data }
  },

  changeBlock (state, payload) {
    const { sequence } = payload
    const blockMap = { ...state.blockMap }
    const item = { ...blockMap[sequence] }
    item.width = item.width === 50 ? 100 : 50
    blockMap[sequence] = item

    return { ...state, blockMap }
  },

  move (state, payload) {
    const { id, sequence } = payload
    const blocks = [...state.blocks]
    blocks[sequence] = { ...blocks[sequence], resourceId: id }
    return { ...state, blocks }
  },

  addResource (state, payload) {
    const { id, sequence } = payload
    const blockMap = { ...state.blockMap }
    blockMap[sequence] = { ...blockMap[sequence], id }
    return { ...state, blockMap }
  },

  cutResource (state, payload) {
    const { originSequence, sequence } = payload
    if (originSequence === sequence) {
      return state
    }
    const theState = this.addResource(state, payload)
    const blockMap = theState.blockMap
    blockMap[originSequence].id = null

    return { ...theState, blockMap }
  },

  delResource (state, payload) {
    const { sequence } = payload

    // 删除资源也同时删除筛选器
    const { id } = state.blockMap[sequence]

    const filterList = []
    state.filterList.forEach((item) => {
      const { refParamMap } = item
      if (refParamMap[id]) {
        delete refParamMap[id]
      }
      item.refParamMap = refParamMap
      filterList.push(item)
    })

    const blockMap = {}
    Object.keys(state.blockMap).forEach((key) => {
      blockMap[key] = { ...state.blockMap[key] }
      if (+sequence === +key) {
        blockMap[key].id = null
      }
    })
    return { ...state, blockMap, filterList }
  },

  addReportConfig (state, payload) {
    const { id, data } = payload
    const reportConfigMap = { ...state.reportConfigMap }
    reportConfigMap[id] = data
    return { ...state, reportConfigMap }
  },

  setFilterList (state, payload) {
    const { filterList } = payload

    return { ...state, filterList }
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
