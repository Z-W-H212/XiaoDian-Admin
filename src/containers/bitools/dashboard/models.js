const initState = {
  error: null,
  gw: 128,
  gh: 600,
  interval: 0,
  selected: null,
  title: '',
  desc: '',
  childMap: {},
}

const reducer = {
  init (state, payload) {
    return { ...state, ...initState }
  },
  setInterval (state, payload) {
    const { interval } = payload
    return { ...state, interval }
  },
  addDashboardChild (state, payload) {
    const { id } = payload
    const childMap = { ...state.childMap }
    childMap[id] = {
      id,
      width: 64,
      height: 16,
      x: 0,
      y: 0,
    }
    return { ...state, ...childMap }
  },
  moveItem (state, payload) {
    const { id, offsetX, offsetY } = payload
    const { gw, gh, interval } = state
    const item = { ...state.childMap[id] }
    let x = item.x + Math.floor(offsetX / interval)
    let y = item.y + Math.floor(offsetY / interval)
    if (x < 0) {
      x = 0
    } else if (x + item.width > gw) {
      x = gw - item.width
    }

    if (y < 0) {
      y = 0
    } else if (y + item.height > gh) {
      y = gh - item.height
    }
    const childMap = { ...state.childMap }
    childMap[id] = item

    return { ...state, childMap }
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
