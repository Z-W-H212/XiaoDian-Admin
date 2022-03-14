import { useState, useEffect } from 'react'
import { Spin, Checkbox, message, Popconfirm } from 'antd'

function AsyncCheckbox (props) {
  const { title, value, onRequest, disabled, popconfirm, ...restProps } = props
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(value)
  const [popconfirmShow, setPopconfirmShow] = useState(false)

  useEffect(() => {
    setChecked(value)
  }, [value])

  const onConfirm = async () => {
    try {
      setLoading(true)
      await onRequest(!checked)
      setLoading(true)
      setChecked(!checked)
      message.success('提交成功')
    } catch (err) {
      message.error('提交失败')
    }
    setLoading(false)
  }

  const handleVisiable = (visible) => {
    if (!visible) return setPopconfirmShow(visible)
    if (popconfirm) {
      setPopconfirmShow(visible)
    } else {
      onConfirm()
    }
  }

  return (
    <Popconfirm
      overlayStyle={{ maxWidth: 360 }}
      title={popconfirm?.title || '确定执行该操作？'}
      visible={popconfirmShow}
      okText={popconfirm?.okText || '确定'}
      cancelText={popconfirm?.cancelText || '取消'}
      disabled={disabled}
      destroyTooltipOnHide
      onConfirm={onConfirm}
      onCancel={() => setPopconfirmShow(false)}
      onVisibleChange={handleVisiable}
    >
      <Spin spinning={loading} {...restProps}>
        <Checkbox
          disabled={disabled}
          checked={checked}
        >
          {title}
        </Checkbox>
      </Spin>
    </Popconfirm>
  )
}

export default AsyncCheckbox
