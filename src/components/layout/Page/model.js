const initState = {
  error: null,
  headerHeight: 0,
  footerHeight: 0,
}

const reducer = {
  init (state, payload) {
    return { ...state, ...initState }
  },

  setHeaderHeight (state, payload) {
    const { height } = payload
    return { ...state, headerHeight: height }
  },

  setFooterHeight (state, payload) {
    const { height } = payload
    return { ...state, footerHeight: height }
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
    throw new Error('Unknown action')
  },
}
