const initState = {
  fieldListInstance: undefined,
  drillInstance: undefined,
  dimensionInstance: undefined,
  indicatorInstance: undefined,
}

const reducer = {
  initInstance (state, payload) {
    return { ...state, [payload.field]: payload.instance }
  },
  disabled (state, payload) {
    if (state[payload.field]) {
      state[payload.field]?.current?.sortable.option('disabled', payload.disabled)
    }
    return { ...state }
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
