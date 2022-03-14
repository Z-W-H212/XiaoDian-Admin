import { useMemo, useContext, useReducer, useEffect } from 'react'
import className from '@/utils/className'
import Context from './Context'
import model from './model'

import style from './style.module.less'

function Page (props) {
  const [state, dispatch] = useReducer(model.reducer, model.state)

  return (
    <Context.Provider value={{ state, dispatch }}>
      <div className={className(props, style.page)}>
        {props.children}
      </div>
    </Context.Provider>
  )
}

Page.Header = function Header (props) {
  const { height, background } = props
  const { dispatch } = useContext(Context)

  useEffect(() => {
    if (typeof height === 'number') {
      dispatch({
        type: 'setHeaderHeight',
        payload: { height: height || 0 },
      })
    } else if (height !== undefined) {
      throw new Error('The Header component prop height should be number')
    }
  }, [height])

  const styleOption = useMemo(() => {
    const style = {
      height: height || 'auto',
      marginBottom: -height || 0,
      background: background,
    }
    return style
  }, [height, background])

  return (
    <div className={className(props, style.header)} style={styleOption}>
      {props.children}
    </div>
  )
}

Page.Body = function Body (props) {
  const { state } = useContext(Context)

  const styleOption = useMemo(() => {
    const { headerHeight, footerHeight } = state
    const style = {
      borderTop: `${headerHeight}px solid transparent`,
      marginBottom: -footerHeight,
    }
    return style
  }, [state])

  return (
    <div className={className(props, style.body)} style={styleOption}>
      {props.children}
    </div>
  )
}

Page.Bottom = function Bottom (props) {
  const { height } = props
  const { dispatch } = useContext(Context)

  useEffect(() => {
    if (typeof height === 'number') {
      dispatch({
        type: 'setFooterHeight',
        payload: { height },
      })
    } else if (height !== undefined) {
      throw new Error('The Bottom component prop height should be number')
    }
  }, [height])

  return (
    <div className={className(props, style.bottom)}>
      {props.children}
    </div>
  )
}

export default Page
