import { useRef, useState } from 'react'
import { Layout, Button, Space, Typography, Divider, Modal, message } from 'antd'
import { useHistory } from 'react-router-dom'
import ProTable from '@ant-design/pro-table'
import { getUserList, deleteUserBatch, getUserRoleList, addUserRoleList, updateUserRoleList } from '@/services/admin/permission-user'
import UserPicker from '@/components/user-picker'
import RolePicker from './components/role-picker'

import { ExclamationCircleOutlined } from '@ant-design/icons'

const { Content } = Layout

/**
 * 用户列表tab页
 */
function PermissionUserList () {
  const actionRef = useRef()
  const history = useHistory()
  const [userPickModal, setUserPickModal] = useState(null)
  const [userRoleModal, setUserRoleModal] = useState(null)
  const columns = [
    {
      title: '用户花名',
      key: 'nickName',
      dataIndex: 'nickName',
      width: 100,
    },
    {
      title: '岗位',
      key: 'positionName',
      dataIndex: 'positionName',
      search: false,
      width: 130,
    },
    {
      title: '在职状态',
      key: 'status',
      width: 100,
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        0: {
          text: '在职',
        },
        1: {
          text: '离职',
        },
        2: {
          text: '离职中',
        },
      },
    },
    {
      title: '当前部门',
      key: 'departmentName',
      dataIndex: 'departmentName',
      search: false,
    },
    {
      title: '角色',
      key: 'roles',
      dataIndex: 'roles',
      search: false,
      render (_, row) {
        return (
          <Space split={<Divider type="vertical" />}>
            {
              _.map(e => (
                <Typography.Link
                  key={e.id}
                  onClick={() => history.push(`/permit/role?roleId=${e.id}`)}
                >
                  {e.roleName}
                </Typography.Link>
              ))
            }
          </Space>
        )
      },
    },
    {
      title: '部门角色',
      key: 'deptRoles',
      dataIndex: 'deptRoles',
      search: false,
      render (_, row) {
        return (
          <Space split={<Divider type="vertical" />}>
            {
              _.map(e => (
                <Typography.Link
                  key={e.id}
                  onClick={() => history.push(`/permit/role?roleId=${e.id}`)}
                >
                  {e.roleName}
                </Typography.Link>
              ))
            }
          </Space>
        )
      },
    },
    {
      title: '操作',
      fixed: 'right',
      width: 100,
      valueType: 'option',
      render: (_, row) => [
        <Typography.Link
          key="optin-edit"
          onClick={() => setUserRoleModal({ userId: row.id, isEdit: true })}
        >
          编辑
        </Typography.Link>,
        <Typography.Link
          key="optin-remove"
          onClick={() => {
            const modelInstance = Modal.confirm({
              title: '操作不可逆，是否确认删除？',
              icon: <ExclamationCircleOutlined />,
              async onOk () {
                try {
                  await deleteUserBatch({ userIds: [row.id] })
                  message.success('删除成功')
                  modelInstance.destroy()
                  await actionRef.current.reloadAndRest()
                } catch (err) {
                  message.error('删除失败')
                }
              },
            })
          }}
        >
          删除
        </Typography.Link>,
      ],
    },
  ]

  const onOrgPickerFinish = async (values) => {
    setUserPickModal(null)
    setUserRoleModal({ userId: values.id })
  }

  /**
   * 编辑/添加操作保存用户
   */
  const onRolePickFinish = async (values) => {
    try {
      if (userRoleModal.isEdit) {
        await updateUserRoleList({
          roleIds: values,
          userId: userRoleModal.userId,
        })
      } else {
        await addUserRoleList({
          roleIds: values,
          userId: userRoleModal.userId,
        })
      }

      setUserPickModal(null)
      await actionRef.current?.reload()
    } catch (err) {
      message.error('保存失败')
    }
  }

  /**
   * proTable自带属性：自定义批量操作工具栏
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
                await deleteUserBatch({ userIds: selectedRowKeys })
                message.success('批量删除成功')
                modelInstance.destroy()
                await actionRef.current?.reload()
                onCleanSelected()
              } catch (err) {
                message.error('批量删除失败')
              }
            },
          })
        }}
      >批量删除</a>
    </Space>
  )
  return (
    <Layout flex="auto">
      <Content>
        <UserPicker
          visible={userPickModal}
          onFinish={onOrgPickerFinish}
          onClose={() => setUserPickModal(null)}
        />
        {
          userRoleModal && <RolePicker
            onRequest={async (values) => {
              const result = await getUserRoleList({
                targetUserId: userRoleModal.userId,
              })
              return result.map(e => ({
                value: e.id,
                label: e.roleName,
                checked: e.selectStatus,
              }))
            }}
            onFinish={onRolePickFinish}
            onClose={() => setUserRoleModal(null)}
          />
        }

        <ProTable
          columns={columns}
          actionRef={actionRef}
          rowSelection={{}}
          tableAlertOptionRender={tableAlertOptionRender}
          request={async (params) => {
            const result = await getUserList({
              ...params,
              currentPage: params.current,
            })
            return {
              data: result.list,
              success: true,
              total: Number(result.total),
            }
          }}
          rowKey="id"
          search={{
            labelWidth: 'auto',
          }}
          scroll={{ x: 'max-content' }}
          toolBarRender={() => [
            <Button key="button" type="primary" onClick={() => setUserPickModal({})}>
              添加
            </Button>,
          ]}
        />
      </Content>
    </Layout>
  )
}

export default PermissionUserList
