import { useRef, useState, useMemo } from 'react'
import Icon, { CloseOutlined } from '@ant-design/icons'
import { Dropdown, Menu } from 'antd'
import reportTargetMap from '@/static/reportTargetMap'
import className from '@/utils/className'
import style from './style.module.less'
import DragIcon from './drag.svg.jsx'

export default function Target (props) {
  const { targetKey, title, htmlTitle, menuData, defaultValue, highlight, numberFormat, showNumberFormat } = props
  const ref = useRef()
  const [selectedValue, setSelected] = useState(defaultValue)

  const targetStyle = useMemo(() => {
    const styleOpt = { borderColor: highlight ? '#1890FF' : undefined }
    if (ref.current) {
      const { width } = ref.current.getBoundingClientRect()
      styleOpt.width = width
    }

    return styleOpt
  }, [ref.current, highlight])

  function onClick (event) {
    event.preventDefault() // 防止文字双击选中
    event.stopPropagation()
    props.onClick && props.onClick(targetKey, event)
  }

  function onClose (event) {
    event.preventDefault()
    event.stopPropagation()
    props.onClose && props.onClose(targetKey, event)
  }

  function onChange ({ key }) {
    if (key === 'numberFormat') {
      props.onChange && props.onChange(targetKey, key)
      return
    }
    if (key !== selectedValue) {
      setSelected(key)
      props.onChange && props.onChange(targetKey, key)
    }
  }

  const menu = useMemo(() => {
    if (!menuData) {
      return null
    }
    const menuList = menuData.map((key) => {
      return <Menu.Item key={key}>{reportTargetMap[key] || key}</Menu.Item>
    })
    if (showNumberFormat) {
      menuList.push(
        <Menu.Divider />,
        <Menu.Item key="numberFormat">{numberFormat}设置数值格式</Menu.Item>,
      )
    }
    return <Menu style={targetStyle} onClick={onChange}>{menuList}</Menu>
  }, [menuData, targetStyle, selectedValue, numberFormat, showNumberFormat])

  const children = useMemo(() => {
    let iconClose = null
    let iconDrag = null
    if (props.onClose) {
      iconClose = (
        <div className={style.close} onClick={onClose}>
          <CloseOutlined />
        </div>
      )
    }

    if (props.draggable) {
      iconDrag = (
        <Icon className={style.prefixIcon} component={DragIcon} />
      )
    }

    return (
      <>
        <Dropdown disabled={!menu} overlay={menu}>
          <div className={style.title}>
            {iconDrag}{title}
          </div>
        </Dropdown>
        {iconClose}
      </>
    )
  }, [menu, title, onClose])

  return (
    <div
      ref={ref}
      className={className(props, style.target)}
      onClick={onClick}
      style={targetStyle}
    >
      <div title={htmlTitle} className={style.targetWrap} style={{ opacity: +!props.isDragging }}>
        {children}
      </div>

    </div>
  )
}
