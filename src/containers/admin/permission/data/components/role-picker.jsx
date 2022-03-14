import { useEffect, useCallback, useState } from 'react'
import { message, Drawer, Tag, Space, Spin, Button, Empty } from 'antd'
import { UsergroupAddOutlined } from '@ant-design/icons'
import { getAsyncTree } from '@/services/admin/permission-data'
import useFetch from '@/hooks/useFetch'
import RichTree from '@/components/base/RichTree'

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
    try {
      await onFinish(checkboxList)
      message.success('提交成功')
    } catch (err) {
      message.error('提交失败')
    }
  }

  function onSelect (departmentId, userId, nickName, organization) {
    const hasItem = checkboxList.find((item) => {
      return item.userId === userId && item.value === departmentId
    })
    if (hasItem) {
      message.error('选择已存在')
    } else {
      handleRoleAdd({
        checked: true,
        label: nickName,
        userId,
        value: departmentId,
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
                    {e.label}
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
  const [treeRes, fetchAsyncTree] = useFetch(getAsyncTree, { data: [] })
  const [treeMap, setTreeMap] = useState({})
  const fetch = async (nodeKey) => {
    let params = {}
    if (nodeKey) {
      const [departmentId, userId, , organization] = nodeKey.split('-')
      params = { departmentId, userId, organization: organization || null }
    }

    const data = await fetchAsyncTree(params)
    const map = {}
    data.forEach((item) => {
      const { organization, departmentId, departmentName, userId, nickName, role, hasChildren } = item
      const id = `${departmentId || ''}-${userId || ''}-${nickName || departmentName || ''}-${organization || ''}-${role || ''}`
      const orgNode = {
        id,
        parentId: nodeKey || null,
        title: departmentName ? `${departmentName}-${nickName}` : nickName,
        isLeaf: !hasChildren,
        children: [],
      }
      map[id] = orgNode
    })
    return map
  }

  useEffect(() => {
    fetch().then((data) => {
      setTreeMap(merge(treeMap, data))
    })
  }, [])

  const loadChildren = async (node) => {
    const { eventKey } = node.props
    const data = await fetch(eventKey)
    setTreeMap(merge(treeMap, data))
  }

  const onSelect = async (selectedKeys) => {
    if (selectedKeys.length === 0) {
      return false
    }
    const [deptId, userId, nickName, organization] = selectedKeys[0].split('-')
    props.onSelect && props.onSelect(deptId, userId, nickName, organization)
  }

  return (
    <Spin spinning={treeRes.loading}>
      <RichTree data={treeMap} loadData={loadChildren} onSelect={onSelect} />
    </Spin>
  )
}
