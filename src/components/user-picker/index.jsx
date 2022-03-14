import { useState, useRef, useMemo } from 'react'
import { Breadcrumb, Input, Drawer, Space, Button } from 'antd'
import { PartitionOutlined, PlusCircleOutlined } from '@ant-design/icons'
import ProList from '@ant-design/pro-list'
import { getDepById, getUserByDepId, getUserSearch } from '@/services/admin/permission-role'

/**
 * 添加用户的右侧抽屉组件
 */
export default (props) => {
  const { onFinish, onClose, visible, rowType, title } = props
  const actionRef = useRef()
  const [depBreadcrumb, setDepBreadcrumb] = useState([])
  const [depId, setDepId] = useState(1)
  const [searchUser, setSearchUser] = useState(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [loading, setLoading] = useState(false)

  /**
   * 点击下级进行depBreadcrumb累加以及角色列表请求
   */
  const onClickDep = (row) => {
    const { id, key, title } = row
    setDepId(id)
    actionRef.current.reload()
    setDepBreadcrumb([...depBreadcrumb, { key, id, title }])
  }
  /**
   * 点击面包屑进行depId设置以及角色列表请求
   */
  const onClickBreadcrumb = (index, row) => {
    let _breadcrumb, _depId
    if (index === 0) {
      _breadcrumb = []
      _depId = 1
    } else {
      _breadcrumb = [...depBreadcrumb.slice(0, index)]
      _depId = row.id
    }
    setSearchUser(null)
    setDepBreadcrumb(_breadcrumb)
    setDepId(_depId)
    actionRef.current.reload()
  }

  /**
   * 添加已选择角色
   */
  const getIds = useMemo(() => {
    const ids = []
    selectedRowKeys.forEach((e) => {
      const [type, id] = e.split('_')
      if (type === 'usr') {
        ids.push(id)
      }
    })
    return ids
  }, [selectedRowKeys])

  const onUserSearch = async (e) => {
    setSearchUser(e)
    await actionRef.current.reload()
  }

  /**
   * 清空数据
   */
  const cleanState = async () => {
    setDepBreadcrumb([])
    setDepId(1)
    setSearchUser(null)
    setSelectedRowKeys([])
    await actionRef?.current?.reloadAndRest()
  }

  const handleSubmit = async () => {
    setLoading(true)
    await onFinish(getIds)
    await cleanState()
    setLoading(false)
  }

  const handleUserSubmit = async (userId) => {
    setLoading(true)
    await onFinish(userId)
    await cleanState()
    setLoading(false)
  }

  const handleClose = async () => {
    await cleanState()
    onClose()
  }

  /**
   * 勾选框渲染判断
   */
  const rowSelection = rowType === 'checkbox'
    ? {
      selectedRowKeys,
      preserveSelectedRowKeys: true,
      renderCell (val, row, dom, el) {
        return row._type !== 'dep' ? el : null
      },
      onChange: keys => setSelectedRowKeys(keys),
    }
    : null

  /**
   * Drawer属性设置
   */
  const drawerProps = {
    width: 500,
    title,
    onClose: handleClose,
    visible,
    closable: false,
    destroyOnClose: true,
  }

  /**
   * Drawer底部组件
   */
  if (rowType === 'checkbox') {
    drawerProps.footer = (
      <Space align="baseline" style={{ width: '100%', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 'normal', fontSize: '14px' }}>已选择：{getIds.length}个用户</div>
        <Space>
          <Button onClick={async () => onClose()}>取消</Button>
          <Button type="primary" onClick={async () => await handleSubmit()} loading={loading}>确认</Button>
        </Space>
      </Space>
    )
  }

  return (
    <>
      <Drawer {...drawerProps}>
        <div style={{ padding: '0 6px' }}>
          <Input.Search
            allowClear
            placeholder="搜索花名"
            onSearch={onUserSearch}
            style={{ marginBottom: '16px' }}
          />
          <Breadcrumb separator=">">
            <Breadcrumb.Item>通讯录</Breadcrumb.Item>
            <Breadcrumb.Item href="javascript:;" onClick={() => onClickBreadcrumb(0)}>小电科技</Breadcrumb.Item>
            {
              depBreadcrumb.map((e, i) => (
                <Breadcrumb.Item
                  key={e.key}
                  href="javascript:;"
                  onClick={() => onClickBreadcrumb(i + 1, e)}
                >
                  {e.title}
                </Breadcrumb.Item>
              ))
            }
          </Breadcrumb>
        </div>
        {/**
         * 用户添加列表
         */}
        <ProList
          actionRef={actionRef}
          split
          loading={loading}
          metas={{
            title: {},
            description: {},
            actions: {
              render (_, row) {
                if (row._type === 'dep') {
                  return (<a onClick={e => onClickDep(row)}><PartitionOutlined /> 下级</a>)
                }
                if (row._type === 'person' && rowType !== 'checkbox') {
                  return (
                    <a onClick={async () => handleUserSubmit(row)}>
                      <PlusCircleOutlined /> 添加
                    </a>
                  )
                }
              },
              search: false,
            },
          }}
          rowKey="key"
          rowSelection={rowSelection}
          request={async (params) => {
            setLoading(true)
            if (searchUser) {
              const userList = (await getUserSearch({ nickName: searchUser }))
                .map(e => ({
                  title: e.nickName,
                  key: `usr_${e.id}`,
                  id: e.id,
                  description: e.positionName || ' ',
                  _type: 'person',
                }))
              setLoading(false)
              return {
                data: userList,
              }
            }

            const depList = (await getDepById(depId))
              .map(e => ({
                ...e,
                key: `dep_${e.key}`,
                description: ' ',
                id: e.key,
                _type: 'dep',
              }))

            const userList = (await getUserByDepId(depId))
              .map(e => ({
                title: e.nickName,
                key: `usr_${e.id}`,
                id: e.id,
                description: e.positionName || ' ',
                _type: 'person',
              }))

            setLoading(false)

            return {
              data: [...depList, ...userList],
            }
          }}
        />
      </Drawer>
    </>
  )
}
