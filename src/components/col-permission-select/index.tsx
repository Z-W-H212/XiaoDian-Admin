import { message, Row, Col, Space, Button, Modal, Input, Typography, Form } from 'antd'
import ProTable from '@ant-design/pro-table'
import { PlusOutlined, EllipsisOutlined, DownOutlined, SearchOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'

interface Props {
  visible: boolean;
  params: Params;
  onOk: (selectedKeys: string[], params: Params) => void;
  onRequest (params: Params): Promise<{ data: DataSource[] }>;
  onCancel (): void;
}

interface Params {
  fileId: string;
  dbName?: string;
  tableName?: string;
  [key: string]: any
}

interface DataSource {
  id: string;
  alias: string;
  name: string;
  checked: boolean;
}

export function ColPermissionSelect (props: Props) {
  const { visible, params, onRequest, onOk, onCancel } = props
  const [datasource, setDatasource] = useState<DataSource[]>([])
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [searchValue, setSeachValue] = useState<string>('')
  const [form] = Form.useForm()
  const columns = [
    {
      title: '字段名',
      dataIndex: 'name',
    },
    {
      title: '字段别名',
      dataIndex: 'alias',
    },
  ]

  const makeRequest = async () => {
    if (!onRequest) return

    try {
      const result = await onRequest(params)
      setDatasource(result.data)
      setSelectedKeys(result.data.filter(e => e.checked).map(e => e.id))
    } catch (err) {
      message.error('请求失败')
    }
  }

  const handleOk = async () => {
    await form.validateFields()
    onOk(selectedKeys, params)
  }

  const handleSearch = (e) => {
    setSeachValue(e.target.value)
  }

  const rowSelection = {
    selectedRowKeys: selectedKeys,
    onSelectAll (selected) {
      // 处理搜索选择全部和取消全部 只对搜索出来的数据生效
      const list = datasource.filter(e => (
        e.name.indexOf(searchValue) > -1 ||
        e.alias.indexOf(searchValue) > -1
      ))
      list.forEach((item) => {
        if (selected) {
          selectedKeys.indexOf(item.id) < 0 && selectedKeys.push(item.id)
        } else {
          selectedKeys.splice(selectedKeys.indexOf(item.id), 1)
        }
      })
      setSelectedKeys([...selectedKeys])
    },
    onSelect (record, selected) {
      // 为了处理搜索时候的选择 所以不用 onChange 和 selectedRows
      if (selected) {
        selectedKeys.push(record.id)
      } else {
        selectedKeys.splice(selectedKeys.indexOf(record.id), 1)
      }
      setSelectedKeys([...selectedKeys])
    },
  }

  useEffect(() => {
    makeRequest()
  }, [])

  return (
    <Modal
      title="列权限"
      visible={visible}
      onOk={handleOk}
      onCancel={() => onCancel()}
      width="50vw"
    >
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="字段或字段别名"
        onChange={handleSearch}
      />
      <ProTable
        style={{ marginTop: 20 }}
        rowSelection={rowSelection}
        tableAlertRender={({ selectedRowKeys }) => (
          <Space size={24}>
            <span>
              已选择 {selectedRowKeys.length} 项
            </span>
          </Space>
        )}
        tableAlertOptionRender={() => (
          <a onClick={() => setSelectedKeys([])}>取消选择</a>
        )}
        pagination={{ pageSize: 10 }}
        toolBarRender={false}
        search={false}
        size="small"
        rowKey="id"
        columns={columns}
        dataSource={datasource.filter(e => (
          e.name.indexOf(searchValue) > -1 ||
          e.alias.indexOf(searchValue) > -1
        ))}
      />
    </Modal>
  )
}
