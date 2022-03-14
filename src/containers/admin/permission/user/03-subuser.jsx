import { useState, useMemo, useRef, useEffect } from 'react'
import { Layout, message, Typography, Button, Menu, Modal, Input, Space } from 'antd'
import ProTable from '@ant-design/pro-table'
import Group from '@/components/group'
import OrgPicker from '@/components/user-picker'
import RolePicker from './components/role-picker'
import DepPicker from '@/components/dep-picker'
import { ExclamationCircleOutlined, SearchOutlined } from '@ant-design/icons'
import {
  getSubuserList,
  addSubuser,
  deleteSubuser,
  getSubuserRoleList,
  deleteSubuserRole,
  getSubuserUserList,
  addSubuserUser,
  deleteSubuserUser,
  getSubuserRoleListOptions,
  addSubuserRoleList,
  getDepartmentList,
  addDepartmentList,
  deleteDepartmentList,
} from '@/services/admin/permission-user'

const { Sider, Content } = Layout

/**
 * 用户二级授权tab页
 */
function PermissionUserSubuser () {
  const [selectedGroup, setSelectGroup] = useState(null)
  const [userPickModal, setUserPickModal] = useState(null)
  const [userListPickModal, setUserListPickModal] = useState(null)
  const [userRoleModal, setUserRoleModal] = useState(null)
  const [depPickModal, setDepPickModal] = useState(null)
  const [activeKey, setActiveKey] = useState('torole')
  const groupActionRef = useRef()
  const tableActionRef = useRef()
  const [tableParams, setTableParams] = useState({})
  const [defaultSelectedKey, setDefaultSelectedKey] = useState('')

  const onUserPickerFinish = async (values) => {
    try {
      const { id } = values
      await addSubuser(values.id)
      message.success('添加成功')
      setSelectGroup(id)
      setDefaultSelectedKey(id)
      await groupActionRef.current.reload()
    } catch (err) {
      message.error('添加失败')
    }
  }

  const onUserListPickerFinish = async (values) => {
    try {
      await addSubuserUser({
        targetUserIds: values,
        userId: selectedGroup,
      })
      message.success('添加成功')
      setUserListPickModal(null)
      await tableActionRef.current.reload()
    } catch (err) {
      message.error('添加失败')
    }
  }

  const onRolePickFinish = async (values) => {
    await addSubuserRoleList({
      targetRoleIds: values,
      userId: selectedGroup,
    })
    await tableActionRef.current.reload()
  }

  const onDepPickerFinish = async (values) => {
    try {
      const { depIds } = values
      await addDepartmentList({
        targetDepIds: depIds,
        userId: selectedGroup,
      })
      message.success('提交成功')
      setDepPickModal(null)
      setDefaultSelectedKey('')
      await tableActionRef.current.reload()
      return true
    } catch (err) {
      message.error('提交失败')
    }
  }

  /**
   * 根据tabIndex 切换菜单列表
   */
  const columns = useMemo(() => {
    const roleColumns = [
      {
        key: 'roleName',
        dataIndex: 'roleName',
        title: '角色名称',
        filterDropdown: () => (
          <div style={{ padding: 8 }}>
            <Input.Search allowClear onSearch={e => setTableParams({ roleName: e })} />
          </div>
        ),
        filterIcon: filtered => (
          <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
        ),
      },
      {
        key: 'roleDesc',
        dataIndex: 'roleDesc',
        title: '角色描述',
      },
    ]

    const userColumns = [
      {
        key: 'nickName',
        dataIndex: 'nickName',
        title: '用户名称',
        filterDropdown: () => (
          <div style={{ padding: 8 }}>
            <Input.Search allowClear onSearch={e => setTableParams({ nickName: e })} />
          </div>
        ),
        filterIcon: filtered => (
          <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
        ),
      },
      {
        key: 'positionName',
        dataIndex: 'positionName',
        title: '用户描述',
      },
    ]

    const depColumns = [
      {
        key: 'departmentName',
        dataIndex: 'departmentName',
        title: '部门',
      },
      {
        key: 'creatorName',
        dataIndex: 'creatorName',
        title: '添加人',
      },
      {
        key: 'createTime',
        dataIndex: 'createTime',
        title: '添加时间',
        valueType: 'dateTime',
      },
    ]

    const baseColumns = [
      {
        title: '操作',
        valueType: 'option',
        render: (_, row) => [
          <Typography.Link
            key="optin-remove"
            onClick={() => {
              const modelInstance = Modal.confirm({
                title: '操作不可逆，是否确认删除？',
                icon: <ExclamationCircleOutlined />,
                async onOk () {
                  try {
                    if (activeKey === 'torole') {
                      await deleteSubuserRole({
                        targetRoleIds: [row.id],
                        userId: selectedGroup,
                      })
                    }

                    if (activeKey === 'touser') {
                      await deleteSubuserUser({
                        targetUserIds: [row.id],
                        userId: selectedGroup,
                      })
                    }
                    if (activeKey === 'todep') {
                      await deleteDepartmentList({
                        targetDepIds: [row.deptId],
                        userId: selectedGroup,
                      })
                    }
                    message.success('删除成功')
                    modelInstance.destroy()
                    await tableActionRef.current.reloadAndRest()
                  } catch (err) {
                    message.error('删除失败')
                  }
                },
              })
            }}
          >
            移除
          </Typography.Link>,
        ],
      },
    ]

    if (activeKey === 'touser') {
      return [...userColumns, ...baseColumns]
    }

    if (activeKey === 'torole') {
      return [...roleColumns, ...baseColumns]
    }
    if (activeKey === 'todep') {
      return [...depColumns, ...baseColumns]
    }
  }, [activeKey, selectedGroup])

  /**
   * 左边列表删除
   */
  const itemMenuRender = item => (
    <Menu>
      <Menu.Item
        onClick={() => {
          const modelInstance = Modal.confirm({
            title: '操作不可逆，是否确认删除？',
            icon: <ExclamationCircleOutlined />,
            async onOk () {
              try {
                await deleteSubuser(item.key)
                message.success('提交成功')
                modelInstance.destroy()
                setSelectGroup(null)
                setDefaultSelectedKey('')
                await groupActionRef.current.reload()
                return true
              } catch (err) {
                message.error('提交失败')
              }
            },
          })
        }}
      >删除</Menu.Item>
    </Menu>
  )

  /**
   * 自定义批量操作
   */
  const tableAlertOptionRender = ({ selectedRowKeys, selectedRows, onCleanSelected }) => (
    <Space>
      <a
        onClick={() => {
          const modelInstance = Modal.confirm({
            title: '操作不可逆，是否确认删除？',
            icon: <ExclamationCircleOutlined />,
            async onOk () {
              try {
                if (activeKey === 'torole') {
                  await deleteSubuserRole({
                    targetRoleIds: selectedRowKeys,
                    userId: selectedGroup,
                  })
                }

                if (activeKey === 'touser') {
                  await deleteSubuserUser({
                    targetUserIds: selectedRowKeys,
                    userId: selectedGroup,
                  })
                }
                if (activeKey === 'todep') {
                  await deleteDepartmentList({
                    targetDepIds: selectedRowKeys,
                    userId: selectedGroup,
                  })
                }
                message.success('删除成功')
                modelInstance.destroy()
                await tableActionRef.current.reloadAndRest()
              } catch (err) {
                message.error('删除失败')
              }
            },
          })
        }}
      >批量删除</a>
    </Space>
  )

  useEffect(() => {
    tableActionRef.current?.reload()
  }, [selectedGroup, activeKey])

  return (
    <>
      <Sider theme="light" width={272} style={{ marginRight: '1px' }}>
        <Group
          defaultSelectedKey={defaultSelectedKey}
          actionRef={groupActionRef}
          itemMenuRender={itemMenuRender}
          onCreateGroup={() => setUserPickModal({})}
          onSelect={(item) => {
            item && setSelectGroup(item)
            setDefaultSelectedKey('')
          }}
          onRequest={async () => {
            const result = await getSubuserList()
            return result.map(e => ({
              key: e.id,
              title: e.nickName,
            }))
          }}
        />
      </Sider>
      <Layout flex="auto">
        <Content>
          {
            selectedGroup && (
              <ProTable
                toolbar={{
                  menu: {
                    type: 'tab',
                    activeKey,
                    items: [
                      {
                        key: 'torole',
                        label: <span>角色列表</span>,
                      },
                      {
                        key: 'todep',
                        label: <span>部门列表</span>,
                      },
                      {
                        key: 'touser',
                        label: <span>用户列表</span>,
                      },
                    ],
                    onChange (key) {
                      setActiveKey(key)
                    },
                  },
                  actions: [
                    // eslint-disable-next-line react/jsx-key
                    <>
                      {
                        activeKey === 'torole' && (
                          <Button type="primary" onClick={() => setUserRoleModal({})}>
                            新增角色
                          </Button>
                        )
                      }
                      {
                        activeKey === 'touser' && (
                          <Button type="primary" onClick={() => setUserListPickModal({})}>
                            新增用户
                          </Button>
                        )
                      }
                      {
                        activeKey === 'todep' && (
                          <Button type="primary" onClick={() => setDepPickModal({})}>
                            新增部门
                          </Button>
                        )
                      }
                    </>,
                  ],
                }}
                search={false}
                rowKey={activeKey === 'todep' ? 'deptId' : 'id'}
                options={false}
                actionRef={tableActionRef}
                columns={columns}
                params={tableParams}
                request={async (params, sorter, filter) => {
                  let result
                  const opt = {
                    ...params,
                    currentPage: params.current,
                    targetUserId: selectedGroup,
                    userId: selectedGroup, // delete
                  }
                  if (activeKey === 'torole') {
                    result = await getSubuserRoleList(opt)
                  }
                  if (activeKey === 'touser') {
                    result = await getSubuserUserList(opt)
                  }
                  if (activeKey === 'todep') {
                    result = await getDepartmentList(opt)
                  }
                  return {
                    data: result.list,
                    success: true,
                    total: Number(result.total),
                  }
                }}
                scroll={{ x: 'max-content' }}
                rowSelection={{}}
                tableAlertOptionRender={tableAlertOptionRender}
              />
            )
          }

        </Content>
      </Layout>

      {
        userRoleModal && (
          <RolePicker
            onRequest={async (values) => {
              const result = await getSubuserRoleListOptions({
                targetUserId: selectedGroup,
              })
              return result.map(e => ({
                value: e.id,
                label: e.roleName,
                disabled: e.selectStatus,
              }))
            }}
            onFinish={onRolePickFinish}
            onClose={() => setUserRoleModal(null)}
          />
        )
      }

      {
        depPickModal && (
          <DepPicker
            params={{ userId: selectedGroup }}
            rowType="checkbox"
            visible={depPickModal}
            onFinish={onDepPickerFinish}
            onClose={() => setDepPickModal(null)}
          />
        )
      }

      <OrgPicker visible={userPickModal} onFinish={onUserPickerFinish} onClose={() => setUserPickModal(null)} />
      <OrgPicker
        rowType="checkbox"
        visible={userListPickModal}
        onFinish={onUserListPickerFinish}
        onClose={() => setUserListPickModal(null)}
      />
    </>
  )
}

export default PermissionUserSubuser
