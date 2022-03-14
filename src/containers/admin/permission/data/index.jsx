import { useRef, useState } from 'react'
import { Button, Typography, Modal, message, Tabs } from 'antd'
import ProTable from '@ant-design/pro-table'
import {
  delPermissionUserRole,
  getPermissionList,
  getPermissionUserRole,
  setPermissionUserRole,
  addPermissionUserRole,
  getCityPermission,
  roleCitySearch,
  editRolePermission,
  deleteRoleCityPermission,
} from '@/services/admin/permission-data'
import { ExclamationCircleOutlined } from '@ant-design/icons'

import UserPicker from '@/components/user-picker'
import RolePicker from './components/role-picker'
import CityPicker from './components/city-picker'

const { TabPane } = Tabs
function PermissionData () {
  const actionRef = useRef()
  const [userPickModal, setUserPickModal] = useState(null)
  const [userRoleModal, setUserRoleModal] = useState(null)
  const [changeTab, setChangeTab] = useState('organization')

  const onOrgPickerFinish = async (values) => {
    if (changeTab === 'organization') {
      await addPermissionUserRole({
        userId: values.id,
        permissionList: [],
      })
    } else {
      await editRolePermission({
        userId: values.id,
        cityPermission: [],
      })
    }
    setUserPickModal(null)
    setUserRoleModal({ userId: values.id, nickName: values.title })
  }

  const onRolePickFinish = async (values) => {
    if (changeTab === 'organization') {
      try {
        await setPermissionUserRole({
          userId: userRoleModal.userId,
          permissionList: values.map(e => ({
            userId: e.userId,
            departmentId: e.value,
          })),
        })
        await actionRef.current?.reload()
      } catch (err) {
        message.error('保存失败')
      }
    } else {
      try {
        await editRolePermission({
          id: userRoleModal.id,
          userId: userRoleModal.userId,
          permissionDTO: {
            cityPermission: values.map(e => ({
              cityCode: e.value,
              cityName: e.label.split('-')[0],
              prvnCode: e.prvnCode,
              prvnName: e.prvnName,
            })),
          },

        })
        await actionRef.current?.reload()
        return true
      } catch (err) {
        message.error('保存失败')
        return false
      }
    }
  }

  function onTabChange (key) {
    actionRef.current?.reloadAndRest()
    setChangeTab(key)
  }

  const columns = [
    {
      title: '用户花名',
      key: 'nickName',
      dataIndex: 'nickName',
      width: 100,
    },
    {
      title: '在职状态',
      key: 'status',
      dataIndex: 'status',
      valueType: 'select',
      width: 100,
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
      title: '创建人',
      key: 'creator',
      dataIndex: 'creator',
      width: 100,
      search: false,
    },
    {
      title: '角色',
      key: 'role',
      dataIndex: 'role',
      width: 100,
      search: false,
    },
    {
      title: '部门',
      key: 'departmentName',
      dataIndex: 'departmentName',
      search: false,
      width: 100,
    },
    {
      title: '权限',
      key: 'permissionList',
      dataIndex: 'permissionList',
      search: false,
      render (value, row) {
        return value.map(item => item.nickName).join(',')
      },
    },
    {
      title: '更新人',
      key: 'updator',
      dataIndex: 'updator',
      width: 100,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      render: (_, row) => [
        <Typography.Link
          key="optin-edit"
          onClick={() => setUserRoleModal({ nickName: row.nickName, userId: row.userId })}
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
                  await delPermissionUserRole(row.userId)
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

  const columnsCity = [
    {
      title: '用户花名',
      key: 'nickName',
      dataIndex: 'nickName',
      width: 100,
    },
    {
      title: '在职状态',
      key: 'status',
      dataIndex: 'status',
      valueType: 'select',
      width: 100,
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
      title: '部门',
      key: 'departmentName',
      dataIndex: 'departmentName',
      search: false,
      width: 100,
    },
    {
      title: '地理城市权限',
      key: 'cityPermission',
      dataIndex: 'permissionDTO',
      search: false,
      render (value, row) {
        return value.cityPermission.map(item => `${item.cityName}`).join(',')
      },
    },
    {
      title: '创建人',
      key: 'creator',
      dataIndex: 'creator',
      width: 100,
      search: false,
    },
    {
      title: '更新人',
      key: 'updator',
      dataIndex: 'updator',
      width: 100,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      render: (_, row) => [
        <Typography.Link
          key="optin-edit"
          onClick={() => { setUserRoleModal({ nickName: row.nickName, userId: row.userId, id: row.id }) }}
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
                  await deleteRoleCityPermission(row.userId)
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
  return (
    <div>
      <Tabs defaultActiveKey="organization" onChange={onTabChange}>
        <TabPane tab="组织架构" key="organization">
          <ProTable
            columns={columns}
            actionRef={actionRef}
            request={async (params) => {
              const result = await getPermissionList({
                ...params,
                pageNum: params.current,
                pageSize: 10,
              })
              return {
                data: result.list,
                success: true,
                total: Number(result.total),
              }
            }}
            rowKey={row => row.sequence}
            search={{
              labelWidth: 'auto',
            }}
            toolBarRender={() => [
              <Button key="button" type="primary" onClick={() => setUserPickModal({})}>
                新建
              </Button>,
            ]}
          />
        </TabPane>
        <TabPane tab="地理城市" key="cityModel">
          <ProTable
            columns={columnsCity}
            actionRef={actionRef}
            request={async (params) => {
              const result = await getCityPermission({
                ...params,
                pageNum: params.current,
                pageSize: 10,
              })
              return {
                data: result.list,
                success: true,
                total: Number(result.total),
              }
            }}
            rowKey={row => row.sequence}
            search={{
              labelWidth: 'auto',
            }}
            toolBarRender={() => [
              <Button key="button" type="primary" onClick={() => setUserPickModal({})}>
                新建
              </Button>,
            ]}
          />
        </TabPane>
      </Tabs>

      <UserPicker
        visible={userPickModal}
        onFinish={onOrgPickerFinish}
        onClose={() => setUserPickModal(null)}
      />
      {
        userRoleModal && changeTab !== 'cityModel' && <RolePicker
          onRequest={async (values) => {
            const result = await getPermissionUserRole({
              nickName: userRoleModal.nickName,
            })
            return result.permissionList.map(e => ({
              value: e.departmentId,
              userId: e.userId,
              label: e.nickName,
              checked: true,
            }))
          }}
          onFinish={onRolePickFinish}
          onClose={() => setUserRoleModal(null)}
        />
      }
      {
        userRoleModal && changeTab === 'cityModel' && <CityPicker
          onRequest={async (values) => {
            const result = await roleCitySearch(
              userRoleModal.userId,
            )
            if (result) {
              return result.permissionDTO.cityPermission.map(e => ({
                value: e.cityCode,
                label: e.cityName,
                ownerId: e.ownerId,
                ownerName: e.ownerName,
                prvnCode: e.prvnCode,
                prvnName: e.prvnName,
                checked: true,
              }))
            }
            return []
          }}
          onFinish={onRolePickFinish}
          onClose={() => setUserRoleModal(null)}
        />
      }
    </div>
  )
}

export default PermissionData
