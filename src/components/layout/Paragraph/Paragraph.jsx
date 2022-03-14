import { useMemo } from 'react'
import { useSize } from 'react-use'
import className from '@/utils/className'
import style from './style.module.less'

function Paragraph (props) {
  const { filled, align, padding } = props

  const styleOption = useMemo(() => {
    const option = {
      alignItems: align,
      padding,
    }
    if (filled) {
      option.height = '100%'
    }
    return option
  }, [filled, align, padding])

  return (
    <div className={className(props, style.paragraph)} style={styleOption}>
      {props.children}
    </div>
  )
}

Paragraph.Block = function Block (props) {
  const flexOption = useFlex(props)

  /**
   * 样式初始化
   */
  const styleOption = useMemo(() => {
    const { width, overflow } = props
    return {
      ...flexOption,
      width,
      overflow, // 扩展这个属性，防止多滚动条出现
      minWidth: width,
    }
  }, [flexOption, props.width])

  const children = useMemo(() => {
    if (flexOption) {
      return (
        <div className={style.flexItemWrap}>{props.children}</div>
      )
    }
    return props.children
  }, [flexOption, props.children])

  if (props.mode === 'auto' && !children) {
    return null
  }

  return (
    <div className={className(props, style.block)} style={styleOption}>
      {children}
    </div>
  )
}

Paragraph.Content = function Content (props) {
  const flexOption = useFlex(props)

  const styleOption = useMemo(() => {
    const { padding } = props
    return {
      ...flexOption,
      padding,
      position: props.position ? 'relative' : null,
    }
  }, [flexOption, props.padding, props.position])

  const children = useMemo(() => {
    if (flexOption) {
      return (
        <div className={style.flexItemWrap}>{props.children}</div>
      )
    }
    return props.children
  }, [flexOption, props.children])

  const [resizeEl, { height }] = useSize(() => <div>{children}</div>)

  const wmark = useMemo(() => {
    if (props.wmark && isFinite(height) && height > 0) {
      const styleObj = {
        backgroundImage: `url(${props.wmark})`,
        height,
        marginTop: -height,
      }
      return (
        <div className={style.position}>
          <div
            className={style.watermark}
            style={styleObj}
          />
        </div>
      )
    }
  }, [height, props.wmark])

  const contentChildren = useMemo(() => {
    if (props.wmark) {
      return (
        <>
          {resizeEl}
          {wmark}
        </>
      )
    }
    return children
  }, [children, resizeEl, wmark, props.wmark])

  return (
    <div className={className(props, style.content)} style={styleOption}>
      {contentChildren}
    </div>
  )
}

export default Paragraph

function useFlex ({ align }) {
  if (!align) {
    return null
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMemo(() => {
    const styleOption = {
      display: 'flex',
      alignItems: align,
    }
    return styleOption
  }, [align])
}
