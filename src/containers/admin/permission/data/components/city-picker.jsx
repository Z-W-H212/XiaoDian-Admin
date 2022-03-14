import { useEffect, useCallback, useState } from 'react'
import { message, Drawer, Tag, Space, Spin, Button, Empty, Tree } from 'antd'
import { UsergroupAddOutlined } from '@ant-design/icons'
import { getRoleCityPermission } from '@/services/admin/permission-data'
import useFetch from '@/hooks/useFetch'

export default ({ onRequest, onFinish, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [checkboxList, setCheckboxList] = useState([])
  const [showOrganization, setShowOrganization] = useState(false)

  const handleRequest = useCallback(async () => {
    setLoading(true)
    const result = await onRequest()
    setCheckboxList(result)
    setLoading(false)
  }, [])

  const handleRoleDelete = (value) => {
    const result = [...checkboxList].filter(i => i.value !== value)
    setCheckboxList(result)
  }

  const handleRoleAdd = (role) => {
    const result = [...checkboxList, role]
    setCheckboxList(result)
  }

  const handleSubmit = async () => {
    await onFinish(checkboxList).then((res) => {
      if (!res) {
        message.error('提交失败')
      } else {
        message.success('提交成功')
      }
    })
  }

  function onSelect (cityCode, cityName, prvnCode, prvnName, ownerName) {
    const hasItem = checkboxList.find((item) => {
      return item.value === cityCode && item.label === cityName
    })
    if (hasItem) {
      message.error('选择已存在')
    } else if (prvnCode === '') {
      return false
    } else {
      handleRoleAdd({
        checked: true,
        label: ownerName ? `${cityName}-${ownerName}` : cityName,
        prvnCode,
        prvnName,
        value: cityCode,
      })
      setShowOrganization(false)
    }
  }

  useEffect(() => {
    handleRequest()
  }, [])

  return (
    <>
      <Drawer
        width={375}
        title="权限列表"
        visible
        onClose={onClose}
        footer={
          <Space align="baseline" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button icon={<UsergroupAddOutlined />} onClick={() => setShowOrganization(true)}>新增权限</Button>
            <Space>
              <Button onClick={async () => onClose()}>取消</Button>
              <Button type="primary" onClick={async () => await handleSubmit()}>确认</Button>
            </Space>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Space direction="vertical">
            {
              checkboxList.length
                ? checkboxList.map(e => (
                  <Tag key={e.value} closable visible onClose={() => handleRoleDelete(e.value)}>
                    {`${e.label}${e.ownerName ? `-${e.ownerName}` : ''}`}
                  </Tag>
                ))
                : <Empty />
            }
          </Space>
        </Spin>
      </Drawer>
      <Drawer
        title="组织架构"
        width={320}
        visible={showOrganization}
        destroyOnClose
        closable={false}
        onClose={() => setShowOrganization(false)}
      >
        <Organization onSelect={onSelect} />
      </Drawer>
    </>
  )
}

function merge (oldMap, newMap) {
  const data = { ...oldMap }
  Object.keys(newMap).forEach((key) => {
    if (data[key]) { return }
    data[key] = newMap[key]
  })
  return data
}

function Organization (props) {
  const [treeRes, fetchAsyncTree] = useFetch(getRoleCityPermission, { data: [] })
  const [treeMap, setTreeMap] = useState({})
  const [treeDate, setTreeDate] = useState([])

  const fetch = async (nodeKey) => {
    const params = {}
    const data = await fetchAsyncTree(params)
    const tree = []
    data.forEach((item) => {
      const map = {
        key: `${item.parentKey || ''}-${item.key || ''}-${item.title || ''}-${item.props.leaderName || ''}`,
        parentKey: item.parentKey || null,
        title: item.props.leaderName ? `${item.title}-${item.props.leaderName}` : item.title,
        children: [],
      }
      item.children.forEach((child) => {
        map.children.push({
          key: `${child.parentKey || ''}-${child.key || ''}-${child.title || ''}-${child.props.leaderName || ''}-${item.title || ''}`,
          parentKey: child.parentKey || null,
          parentName: item.title,
          title: child.props.leaderName ? `${child.title}-${child.props.leaderName}` : child.title,
          children: [],
        })
      })
      tree.push(map)
    })
    setTreeDate(tree)
  }

  useEffect(() => {
    fetch().then((data) => {
      setTreeMap(merge(treeMap, data))
    })
  }, [])

  const onSelect = async (selectedKeys) => {
    if (selectedKeys.length === 0) {
      return false
    }
    const [parentKey, key, title, leaderName, parentName] = selectedKeys[0].split('-')
    props.onSelect && props.onSelect(key, title, parentKey, parentName, leaderName)
  }

  return (
    <Spin spinning={treeRes.loading}>
      <Tree treeData={treeDate} onSelect={onSelect} />
    </Spin>
  )
}
