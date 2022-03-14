import { useRef, useState } from 'react'
import ProTable from '@ant-design/pro-table'
import ProDescriptions from '@ant-design/pro-descriptions'
import { PlusOutlined, EllipsisOutlined } from '@ant-design/icons'
import { Layout, Button, Drawer, message, Dropdown, Menu, Table, Modal } from 'antd'
import { queryTemplates, saveTemplate, removeTemplate, addTemplate, updateTemplateStatus } from '@/services/dataImportService'
import CreateForm from './component/CreateForm'

/**
 * 添加节点
 * @param fields
 */
const handleAdd = async (model) => {
  const hide = message.loading('正在添加')
  try {
    await addTemplate({ ...model })
    hide()
    message.success('添加成功')
    return true
  } catch (error) {
    hide()
    message.error('添加失败请重试！')
    return false
  }
}

/**
 * 更新节点
 * @param fields
 */
const handleEdit = async (model) => {
  const hide = message.loading('正在配置')
  try {
    await saveTemplate(model)
    hide()
    message.success('配置成功')
    return true
  } catch (error) {
    hide()
    message.error('配置失败请重试！')
    return false
  }
}

/**
 *  删除节点
 * @param selectedRows
 */
const handleRemove = async (modelID) => {
  const hide = message.loading('正在删除')
  try {
    await removeTemplate(modelID)
    hide()
    message.success('删除成功')
    return true
  } catch (error) {
    hide()
    message.error('删除失败，请重试')
    return false
  }
}

/**
 * 停启用模型
 * @param {String} record 模型
 */
const handleUpdateStatus = async (record) => {
  const operaText = record.status ? '停用' : '启用'
  const hide = message.loading(`正在${operaText}`)
  try {
    await updateTemplateStatus(record.id, record.status)
    hide()
    message.success(`${operaText}成功`)
    return true
  } catch (error) {
    hide()
    message.error(`${operaText}失败，请重试`)
    return false
  }
}

/**
 *
 * @returns {DataImportTable} 数据导入Table
 */
const DataImportTable = () => {
  const [createModalVisible, handleCreateModalVisible] = useState(false)
  const [stepFormValues, setStepFormValues] = useState({})
  const [openedRow, setOpenedRow] = useState(null)

  const actionRef = useRef()

  /**
   * @param {Array} columns 查询模型表单数据
   */
  const columns = [
    {
      title: '模型ID',
      dataIndex: 'id',
      key: 'id',
      hideInSearch: true,
      width: 180,
    },
    {
      order: 10,
      title: '模型名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '数据表名',
      dataIndex: 'targetTable',
      key: 'targetTable',
      hideInSearch: true,
      render: (text, record) => (<>{record.targetDatabase}.{text}</>),
    },
    {
      title: '模型描述',
      dataIndex: 'comment',
      key: 'comment',
      hideInSearch: true,
      ellipsis: true,
      width: 150,
    },
    {
      order: 9,
      title: '模型状态',
      dataIndex: 'status',
      key: 'status',
      initialValue: 'all',
      width: 80,
      valueEnum: {
        all: { text: '全部', status: 'Default' },
        0: { text: '停用', status: 'Default' },
        1: { text: '启用', status: 'Processing' },
      },
    },
    {
      order: 8,
      title: '创建人',
      valueType: 'text',
      dataIndex: 'creator',
      key: 'creator',
      align: 'center',
      render: (text, record) => (<>{text}<br />{record.createTime}</>),
    },
    {
      order: 7,
      title: '创建时间',
      valueType: 'dateRange',
      dataIndex: 'createTime',
      key: 'createTime',
      hideInTable: true,
    },
    {
      order: 6,
      title: '更新人',
      valueType: 'text',
      dataIndex: 'modifier',
      key: 'modifier',
      align: 'center',
      render: (text, record) => (<>{text}<br />{record.modifyTime}</>),
    },
    {
      order: 5,
      title: '更新时间',
      valueType: 'dateRange',
      dataIndex: 'modifyTime',
      key: 'modifyTime',
      hideInTable: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      fixed: 'right',
      align: 'center',
      render: (_, record) => [
        <a
          key="option-stop"
          onClick={async () => {
            const success = await handleUpdateStatus(record)
            if (success) {
              actionRef.current.reload()
            }
          }}
        >{record.status ? '停用' : '启用'}</a>,
        <a key="option-open" onClick={() => setOpenedRow(record)}>查看明细</a>,
        <Dropdown
          key="option-action"
          overlay={
            <Menu>
              <Menu.Item
                disabled={record.status}
                key="edit"
                onClick={() => {
                  setStepFormValues(record)
                  handleCreateModalVisible(true)
                }}
              >编辑</Menu.Item>
              <Menu.Item
                disabled={record.status}
                key="delete"
                onClick={async () => {
                  Modal.confirm({
                    title: '删除模型',
                    content: '操作不可逆，是否确认继续？',
                    okText: '确认',
                    cancelText: '取消',
                    async onOk () {
                      await handleRemove(record.id)
                      actionRef.current.reloadAndRest()
                    },
                  })
                }}
              >删除</Menu.Item>
            </Menu>
          }
        ><a><EllipsisOutlined /></a></Dropdown>,
      ],
    },
  ]

  /**
   * @param {Array} openedRowColumns 查看明细Table数据
   */
  const openedRowColumns = [
    {
      title: '字段名称',
      dataIndex: 'fieldName',
    },
    {
      title: '字段类型',
      dataIndex: 'dataType',
    },
    {
      title: '字段别名',
      dataIndex: 'alias',
      render: (_, record) => record.alias || record.fieldName,
    },
    {
      title: '可为空',
      dataIndex: 'nullable',
      editable: true,
      width: 90,
      align: 'center',
      render: (_, record) => (record.nullable ? '是' : '否'),
    },
    {
      title: '可导出',
      dataIndex: 'needExport',
      editable: true,
      width: 90,
      align: 'center',
      render: (_, record) => (record.needExport ? '是' : '否'),
    },
  ]

  return (
    <Layout>
      <ProTable
        options={{ fullScreen: false }}
        headerTitle="查询模型"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        scroll={{ x: 1300 }}
        search={{ defaultCollapsed: false, labelWidth: 65 }}
        request={async (params, sorter, filter) => await queryTemplates({ ...params, sorter, filter })}
        toolBarRender={() => [
          <Button
            key="option-add"
            type="primary"
            onClick={() => {
              setStepFormValues({ _open: 'new' })
              handleCreateModalVisible(true)
            }}
          >
            <PlusOutlined /> 新建
          </Button>,
        ]}
      />
      {stepFormValues && Object.keys(stepFormValues).length
        ? (
          <CreateForm
            onSubmit={async (value) => {
              let success
              if (value.id) {
                success = await handleEdit(value)
              } else {
                success = await handleAdd(value)
              }

              if (success) {
                handleCreateModalVisible(false)
                setStepFormValues({})
                actionRef.current.reload()
              }
            }}
            onCancel={() => {
              handleCreateModalVisible(false)
              setStepFormValues({})
            }}
            modalVisible={createModalVisible}
            values={stepFormValues}
          />)
        : null}

      <Drawer
        width={600}
        visible={!!openedRow}
        onClose={() => {
          setOpenedRow(undefined)
        }}
        closable={false}
      >
        {openedRow?.name && (
          <>
            <ProDescriptions
              column={1}
              title={openedRow?.name}
              request={async () => ({ data: openedRow || {} })}
              params={{ id: openedRow?.name }}
              columns={
                /**
                 *查看明细：过滤表单数据
                 */
                columns.filter(e => (!e.hideInTable && e.valueType !== 'option'))
              }
            />
            <ProDescriptions title="模型字段">
              <ProDescriptions.Item>
                <Table
                  columns={openedRowColumns}
                  size="small"
                  bordered
                  dataSource={openedRow.fieldList.map(e => ({ ...e, key: e.fieldName })) || []}
                  pagination={false}
                  scroll={{ y: 300 }}
                />
              </ProDescriptions.Item>
            </ProDescriptions>
          </>
        )}
      </Drawer>
    </Layout>
  )
}

export default DataImportTable
