import { useEffect, useRef, useState } from 'react'
import { message, Typography, Modal, Button } from 'antd'
import ProTable from '@ant-design/pro-table'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import UserPicker from '@/components/user-picker'
import { getRoleUserList, deleteRoleUser, addRoleUser } from '@/services/admin/permission-role'

function Table (props) {
  const { roleId } = props
  const actionRef = useRef()
  const [userPickModal, setUserPickModal] = useState(false)

  const toolBarRender = () => ([
    <Button key="opt-addbutton" type="primary" onClick={() => setUserPickModal(true)}>添加用户</Button>,
  ])

  const columns = [
    {
      key: 'id',
      dataIndex: 'id',
      title: 'id',
      hideInTable: true,
      search: false,
    },
    {
      key: 'nickName',
      dataIndex: 'nickName',
      title: '用户花名',
    },
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
      sorter: true,
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, row) => [
        <Typography.Link
          key="optin-remove"
          onClick={() => {
            const modalInstance = Modal.confirm({
              title: '操作不可逆，是否确认删除？',
              icon: <ExclamationCircleOutlined />,
              async onOk () {
                try {
                  await deleteRoleUser({
                    roleId,
                    userIds: [row.id],
                  })
                  message.success('删除成功')
                  modalInstance.destroy()
                  await actionRef.current.reloadAndRest()
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

  const onOrgPickerFinish = async (values) => {
    try {
      await addRoleUser({
        userIds: values,
        roleId,
      })
      message.success('提交成功')
      setUserPickModal(null)
      await actionRef.current.reloadAndRest()
      return true
    } catch (err) {
      message.error('提交失败')
    }
  }

  useEffect(() => {
    if (actionRef.current) {
      actionRef.current.reloadAndRest()
    }
  }, [roleId])

  return (
    <div>
      <ProTable
        rowKey="id"
        options={false}
        headerTitle="用户列表"
        toolBarRender={toolBarRender}
        actionRef={actionRef}
        columns={columns}
        request={async (params, sorter, filter) => {
          const result = await getRoleUserList({
            roleId,
            ...params,
            orderBy: (sorter.createTime || '').slice(0, 3),
            currentPage: params.current,
          })
          return {
            data: result.list,
            success: true,
            total: Number(result.total),
          }
        }}
        search={{ labelWidth: 65 }}
        scroll={{ x: 'max-content' }}
      />
      <UserPicker
        rowType="checkbox"
        visible={userPickModal}
        onFinish={onOrgPickerFinish}
        onClose={() => setUserPickModal(null)}
      />
    </div>
  )
}

export default Table
