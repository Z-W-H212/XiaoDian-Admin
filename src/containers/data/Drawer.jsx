import { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Input, Button, Drawer, Typography, message, Spin } from 'antd'
import RichTree from '@/components/base/RichTree'
import { getAsyncTree } from '@/services/hrService'
import useFetch from '@/hooks/useFetch'

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

function DrawerView (props) {
  const { data } = props

  const [selectMembers, setSelectMembers] = useState([])
  const [showOrganization, setShowOrganization] = useState(false)

  const [userInfo, setUserInfo] = useState({})

  useEffect(() => {
    // props.getTree()
  }, [])

  useEffect(() => {
    // props.getTree()
    if (data) {
      setUserInfo(data)
      setSelectMembers(data.permissionList)
    }
  }, [data])

  async function onConfirm () {
    if (data) {
      await props.editPermission({
        userId: userInfo.userId,
        permissionList: selectMembers.map((item) => {
          const { userId, departmentId } = item
          return { userId, departmentId }
        }),
      })
    } else {
      await props.addPermission({
        userId: userInfo.userId,
        permissionList: selectMembers.map((item) => {
          const { userId, departmentId } = item
          return { userId, departmentId }
        }),
      })
    }
    props.onConfirm()
  }

  async function onSearch (value) {
    const data = await props.searchMenber({ nickName: value })
    setSelectMembers([])

    setUserInfo(data)
    const { permissionList } = data
    if (permissionList.length > 0) {
      setSelectMembers(permissionList)
    }
  }

  function onDelMember (item) {
    const { departmentId, userId } = item
    const members = selectMembers.filter((item) => {
      if (
        item.userId === userId &&
        item.departmentId === departmentId
      ) {
        return false
      }
      return true
    })
    setSelectMembers(members)
  }

  function onSelect (departmentId, userId, nickName, organization) {
    const hasItem = selectMembers.find((item) => {
      if (
        item.userId === userId &&
        item.departmentId === departmentId
      ) {
        return true
      }
      return false
    })
    if (hasItem) {
      message.error('选择已存在')
    } else {
      setSelectMembers([
        ...selectMembers,
        { departmentId, userId, nickName, organization },
      ])
      setShowOrganization(false)
    }
  }

  return (
    <Drawer
      title="新增权限"
      width={320}
      closable={false}
      visible={props.visible}
    >
      <Button onClick={props.onCancel}>取消</Button>
      <Button onClick={onConfirm}>确认</Button>
      <Input.Search
        placeholder="员工花名"
        size="large"
        onSearch={onSearch}
      />
      <p>花名：{userInfo.nickName}</p>
      <p>员工ID：{userInfo.userId}</p>
      <p>角色：{userInfo.role}</p>
      <p>部门：{userInfo.departmentName}</p>
      <div>
        {selectMembers.map((item, i) => {
          return (
            <Typography.Text key={i} code onClick={() => onDelMember(item)}>
              {item.nickName}
            </Typography.Text>
          )
        })}
      </div>
      <Button disabled={!userInfo.userId} onClick={() => setShowOrganization(true)}>添加数据权限</Button>
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
    </Drawer>
  )
}

export default connect(
  state => ({
    userIdMap: state.global.userIdMap,
    organizationTree: state.global.organizationTree,
    permissionList: state.super.permissionList,
  }),
  dispatch => ({
    getTree: dispatch.global.getTree,
    searchMenber: dispatch.super.searchMenber,
    getPermissionList: dispatch.super.getPermissionList,
    addPermission: dispatch.super.addPermission,
    editPermission: dispatch.super.editPermission,
  }),
)(DrawerView)
