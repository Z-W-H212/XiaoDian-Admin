import { useEffect, useCallback, useState, useMemo } from 'react'
import { message, Drawer, Checkbox, Space, Spin, Button, Empty, Input } from 'antd'

/**
 * 用户角色编辑列表
 */
export default ({ onRequest, onFinish, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [checkboxList, setCheckboxList] = useState([])
  const [seachValue, setSearchValue] = useState('')

  const handleRequest = useCallback(async () => {
    setLoading(true)
    const result = await onRequest()
    setCheckboxList(result)
    setLoading(false)
  }, [])

  const handleCheckChange = (value, item) => {
    /**
     * effected 列表勾选索引
     */
    const effected = [...checkboxList].findIndex(i => i.value === item.value)
    /**
     * 只设置列表checked状态
     */
    setCheckboxList([
      ...checkboxList.slice(0, effected),
      { ...checkboxList[effected], checked: value.target.checked },
      ...checkboxList.slice(effected + 1),
    ])
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      await onFinish(checkboxList.filter(i => i.checked).map(e => e.value))
      message.success('提交成功')
      setLoading(false)
      onClose()
      return true
    } catch (err) {
      message.error('提交失败')
    }
  }

  const onSearch = async (e) => {
    setSearchValue(e)
  }

  /**
   * 列表渲染
   */
  const renderList = useMemo(() => {
    return seachValue
      ? checkboxList.filter(i =>
        String(i.label).toUpperCase()
          .indexOf(String(seachValue).toUpperCase()) > -1)
      : checkboxList
  }, [checkboxList, seachValue])

  useEffect(() => {
    handleRequest()
  }, [])

  return (
    <Drawer
      width={375}
      title="用户角色列表"
      visible
      onClose={onClose}
      footer={
        <Space align="baseline" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button onClick={async () => onClose()}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={loading}>确认</Button>
          </Space>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Input.Search
          allowClear
          placeholder="搜索角色"
          onSearch={onSearch}
          onChange={e => onSearch(e.target.value)}
          style={{ marginBottom: '16px' }}
        />
        <Space direction="vertical">
          {
            renderList.length
              ? renderList.map(item => (
                <Checkbox
                  key={item.value}
                  checked={item.checked}
                  onChange={e => handleCheckChange(e, item)}
                >
                  {item.label}
                </Checkbox>
              ))
              : <Empty />
          }
        </Space>
      </Spin>
    </Drawer>
  )
}
