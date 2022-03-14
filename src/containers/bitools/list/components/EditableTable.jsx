import { useState, useCallback, useEffect } from 'react'
import { Table, Form, Select, Input, message } from 'antd'
import { getAllDatabase } from '@/services/databaseService'
import {
  duplicateNewCheck,
} from '@/services/reportService'

const EditableCell = ({
  editing,
  dataIndex,
  selectData,
  children,
  ...restProps
}) => {
  return (
    <td {...restProps}>
      {editing
        ? (
          <Form.Item
            name={dataIndex}
            noStyle
          >
            <Select size="small">
              {selectData && selectData.map(e => (
                <Select.Option key={e} value={e}>{e}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        )
        : (children)}
    </td>
  )
}

const EditableTable = (props) => {
  const { value, onChange } = props
  const [form] = Form.useForm()
  const [editingKey, setEditingKey] = useState('')
  const [database, setDatabase] = useState([])

  const getDatabase = useCallback(async () => {
    const result = await getAllDatabase()
    setDatabase(Object.keys(result))
  }, [])

  const isEditing = record => record.reportId === editingKey

  const edit = (record) => {
    form.setFieldsValue({
      ...record,
    })
    setEditingKey(record.reportId)
  }

  const cancel = () => {
    setEditingKey('')
  }

  const save = async (record, index) => {
    try {
      const row = await form.validateFields()
      const newValue = [...value]
      const item = newValue[index]

      if (record.nameDuplicate) {
        const duplicateRet = await duplicateNewCheck({
          versionRefId: record.versionRefId,
          name: row.name,
        })
        if (duplicateRet.nameDuplicate) {
          return message.warn('该名称已存在！')
        }
      }
      newValue.splice(index, 1, { ...item, ...row })
      onChange(newValue)
      setEditingKey('')
    } catch (errInfo) {
      // eslint-disable-next-line no-console
      console.error('Validate Failed:', errInfo)
    }
  }

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render (text, record) {
        if (!(isEditing(record) && record.nameDuplicate)) return text
        return (
          <Form.Item
            name="name"
            noStyle
          >
            <Input value={text} />
          </Form.Item>
        )
      },
    },
    {
      title: '来源数据库',
      dataIndex: 'sourceDsName',
      key: 'sourceDsName',
    },
    {
      title: '目标数据库',
      dataIndex: 'targetSourceName',
      key: 'targetSourceName',
      editable: true,
      render (_, record) {
        return record.targetSourceName || '请选择'
      },
    },
    {
      title: '消息',
      dataIndex: 'errorMsg',
    },
    {
      title: '操作',
      width: 90,
      align: 'center',
      render (_, record, index) {
        const editable = isEditing(record)
        if (editable) {
          return [
            <a key="option-save" style={{ marginRight: '8px' }} onClick={() => save(record, index)}>保存</a>,
            <a key="option-cancel" onClick={() => cancel()}>取消</a>,
          ]
        }
        return <a disabled={editingKey !== ''} onClick={() => edit(record)}>编辑</a>
      },
    },
  ]

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col
    }
    return {
      ...col,
      onCell: record => ({
        record,
        dataIndex: col.dataIndex,
        selectData: database,
        title: col.name,
        editing: isEditing(record),
      }),
    }
  })

  useEffect(() => {
    getDatabase()
  }, [getDatabase])

  return (
    <Form form={form} component={false}>
      <div style={{ color: '#000000d9', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>| 字段配置</div>
      <Table
        components={{
          body: {
            cell: EditableCell,
          },
        }}
        size="small"
        bordered
        columns={mergedColumns}
        rowKey="reportId"
        dataSource={value}
        pagination={false}
        scroll={{ y: 250 }}
      />
    </Form>
  )
}

export default EditableTable
