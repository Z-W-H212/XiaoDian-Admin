import { useEffect, useRef, useState } from 'react'
import { message, Typography, Modal, Button } from 'antd'
import ProTable from '@ant-design/pro-table'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import DepPicker from '@/components/dep-picker'
import { getRoleDepartment, deleteRoleDepartment, addRoleDepartment } from '@/services/admin/permission-role'

function Table (props) {
  const { roleId } = props
  const actionRef = useRef()
  const [userPickModal, setUserPickModal] = useState(false)

  const toolBarRender = () => ([
    <Button key="opt-addbutton" type="primary" onClick={() => setUserPickModal(true)}>添加部门</Button>,
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
                  await deleteRoleDepartment({
                    roleId,
                    deptIdList: [row.deptId],
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
      const { depIds } = values
      await addRoleDepartment({
        deptIdList: depIds,
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
        options={false}
        search={false}
        rowKey="deptId"
        headerTitle="部门列表"
        toolBarRender={toolBarRender}
        actionRef={actionRef}
        columns={columns}
        request={async (params, sorter, filter) => {
          const result = await getRoleDepartment({
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
        scroll={{ x: 'max-content' }}
      />
      <DepPicker
        params={{ roleId }}
        rowType="checkbox"
        visible={userPickModal}
        onFinish={onOrgPickerFinish}
        onClose={() => setUserPickModal(null)}
      />
    </div>
  )
}

export default Table
