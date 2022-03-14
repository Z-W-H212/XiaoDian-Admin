import { useState, useRef } from 'react'
import ProTable from '@ant-design/pro-table'
import { PlusOutlined } from '@ant-design/icons'
import { Button, message, Layout } from 'antd'
import { getDatasourceList, addSource, editSource, delSource } from '@/services/datasource'
import { reload } from '@/services/databaseService'
import CreateForm from './CreateForm'
import { confirm } from '@/utils/alertMessage'

/**
 * 数据源管理
 */
const Datasource = () => {
  const [modalVisible, setModalVisible] = useState(false)
  const [formVals, setFormValues] = useState({})
  const actionRef = useRef()
  const columns = [
    {
      key: 'id',
      title: 'ID',
      dataIndex: 'id',
      width: 100,
      ellipsis: true,
    },
    {
      key: 'name',
      dataIndex: 'name',
      title: '名称',
    },
    {
      key: 'type',
      dataIndex: 'type',
      title: '类型',
    },
    {
      key: 'jdbcUrl',
      dataIndex: 'jdbcUrl',
      title: '链接信息',
      width: 300,
      ellipsis: true,
    },
    {
      key: 'comment',
      dataIndex: 'comment',
      title: '描述',
      ellipsis: true,
    },
    {
      key: 'createTime',
      dataIndex: 'createTime',
      title: '创建时间',
    },
    {
      key: 'status',
      dataIndex: 'status',
      title: '状态',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      align: 'center',
      render: (_, record) => [
        <a
          key="opt-refresh"
          onClick={async () => {
            await reload(record.name)
            message.success('刷新成功')
            actionRef.current.reload()
          }}
        >刷新</a>,
        <a
          key="opt-edit"
          onClick={() => {
            setFormValues(record)
            setModalVisible(true)
          }}
        >编辑</a>,
        <a
          key="opt-delete"
          onClick={async () => {
            confirm('是否删除？（该操作不可逆）')(async () => {
              await delSource(record.id)
              actionRef.current.reload()
            })
          }}
        >删除</a>,
      ],
    },
  ]
  return (
    <Layout>
      <ProTable
        headerTitle="数据源查询"
        search={false}
        columns={columns}
        actionRef={actionRef}
        scroll={{ x: 1300 }}
        request={async (params, sorter, filter) => await getDatasourceList({ ...params, sorter, filter })}
        toolBarRender={() => [
          <Button
            key="option-add"
            type="primary"
            onClick={() => {
              setFormValues({ _new: '', online: 1 })
              setModalVisible(true)
            }}
          ><PlusOutlined /> 新建</Button>,
        ]}
      />

      {
        formVals && Object.keys(formVals).length
          ? (
            <CreateForm
              values={formVals}
              onCancel={() => {
                setModalVisible(false)
                setFormValues({})
              }}
              onSubmit={async (e) => {
                if (e.id) {
                  await editSource(e)
                } else {
                  await addSource(e)
                }

                message.success('保存成功')
                setModalVisible(false)
                setFormValues({})
                actionRef.current.reload()
              }}
              modalVisible={modalVisible}
            />
          )
          : null
      }
    </Layout>
  )
}

export default Datasource
