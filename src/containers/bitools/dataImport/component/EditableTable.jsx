import { useState } from 'react'
import { Table, Input, Form, Select } from 'antd'

const EditableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
  const inputNode = inputType === 'select'
    ? (
      <Select size="small">
        <Select.Option value={0}>否</Select.Option>
        <Select.Option value={1}>是</Select.Option>
      </Select>
    )
    : <Input size="small" />
  return (
    <td {...restProps}>
      {
        editing
          ? (
            <Form.Item
              name={dataIndex}
              noStyle
            >
              {inputNode}
            </Form.Item>
          )
          : (children)
      }
    </td>
  )
}

const EditableTable = (props) => {
  const { value, onChange } = props
  const [form] = Form.useForm()
  const [editingKey, setEditingKey] = useState('')

  const isEditing = record => record.key === editingKey

  const edit = (record) => {
    form.setFieldsValue({
      ...record,
    })
    setEditingKey(record.key)
  }

  const cancel = () => {
    setEditingKey('')
  }

  const save = async (key) => {
    try {
      const row = await form.validateFields()
      const newValue = [...value]
      const index = newValue.findIndex(item => key === item.fieldName)
      if (index > -1) {
        const item = newValue[index]
        newValue.splice(index, 1, { ...item, ...row })
        onChange(newValue)
        setEditingKey('')
      } else {
        newValue.push(row)
        onChange(newValue)
        setEditingKey('')
      }
    } catch (errInfo) {
      // eslint-disable-next-line no-console
      console.error('Validate Failed:', errInfo)
    }
  }

  const columns = [
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
      editable: true,
      render: (_, record) => record.alias || record.fieldName,
    },
    {
      title: '可为空',
      dataIndex: 'nullable',
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
    {
      title: '操作',
      width: 90,
      align: 'center',
      render (_, record) {
        const editable = isEditing(record)
        if (editable) {
          return [
            <a key="option-save" style={{ marginRight: '8px' }} onClick={() => save(record.fieldName)}>保存</a>,
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
        inputType: col.dataIndex === 'needExport' ? 'select' : 'input',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    }
  })

  const dataSource = value && value.map(e => ({ ...e, key: e.fieldName }))
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
        dataSource={dataSource}
        pagination={false}
        scroll={{ y: 250 }}
      />
    </Form>
  )
}

export default EditableTable
