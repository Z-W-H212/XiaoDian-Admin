import { useState, useMemo } from 'react'
import { CloseOutlined } from '@ant-design/icons'
import { Dropdown, Menu } from 'antd'
import reportTargetMap from '@/static/reportTargetMap'
import className from '@/utils/className'
import style from '../style.module.less'

export default function Item (props): JSX.Element {
  const { targetKey, title, menuData, defaultValue, numberFormat, showNumberFormat } = props
  const [selectedValue, setSelected] = useState(defaultValue)

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
    } else if (key !== selectedValue || key === 'drill') {
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
    return <Menu onClick={onChange}>{menuList}</Menu>
  }, [menuData, selectedValue, numberFormat, showNumberFormat])

  const children = useMemo(() => {
    let iconClose = null
    if (props.onClose) {
      iconClose = (
        <div className={style.close} onClick={onClose}>
          <CloseOutlined />
        </div>
      )
    }

    return (
      <>
        <Dropdown disabled={!menu} overlay={menu}>
          <div className={style.title}>
            {title}
          </div>
        </Dropdown>
        {iconClose}
      </>
    )
  }, [menu, title, onClose])

  return (
    <li
      style={props.style}
      className={className(props, style.target)}
      onClick={onClick}
    >
      <div className={style.targetWrap}>
        {children}
      </div>
    </li>
  )
}
