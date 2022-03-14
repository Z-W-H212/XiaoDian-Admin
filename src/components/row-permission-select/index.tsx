import { message, Row, Col, Space, Button, Modal, Input, Typography, Form, Tooltip } from 'antd'
import ProTable from '@ant-design/pro-table'
import ProCard from '@ant-design/pro-card'
import { getTableInfo, postRuledRaw } from '@/services/admin/databse'
import { QuestionCircleTwoTone } from '@ant-design/icons'
import { useEffect, useState } from 'react'

const { TextArea } = Input
const { Paragraph } = Typography

export interface Props {
  visible: boolean;
  params: Params;
  onOk: (raw: string, params: Params) => void;
  onRequest (params: Params): Promise<{ data: string }>;
  onCancel (): void;
}

interface Params {
  fileId: string
  dbName: string
  tableName: string
  [key: string]: any
}

export function RowPermissionSelect (props: Props) {
  const { visible, params, onRequest, onOk, onCancel } = props
  const [form] = Form.useForm()
  const [ruleRaw, setRuleRaw] = useState<string>('')

  const columns = [
    {
      title: '字段名',
      key: 'colName',
      dataIndex: 'colName',
      render: text => (
        <Paragraph copyable>{text}</Paragraph>
      ),
    },
    {
      title: '字段别名',
      key: 'colAlias',
      dataIndex: 'colAlias',
    },
  ]

  const handleOk = async () => {
    await form.validateFields()
    onOk(ruleRaw, params)
  }

  const onCheckRule = async () => {
    try {
      await postRuledRaw({ rowRule: ruleRaw, schemaTableId: params.fileId })
      message.success('校验成功')
    } catch (err) {
      message.error('校验错误，服务失联了')
    }
  }

  const makeRequest = async () => {
    if (!onRequest) return

    try {
      const result = await onRequest(params)
      setRuleRaw(result.data)
    } catch (err) {
      message.error('请求失败')
    }
  }

  useEffect(() => {
    makeRequest()
  }, [])

  return (
    <Modal
      title="行权限"
      visible={visible}
      onOk={handleOk}
      onCancel={() => onCancel()}
      width="60vw"
    >
      <ProCard split="vertical">
        <ProCard colSpan="384px" ghost>
          <ProTable
            pagination={{ pageSize: 10 }}
            toolBarRender={false}
            search={false}
            size="small"
            key="colName"
            columns={columns}
            request={async () => {
              const result = await getTableInfo({ ...params, usage: 2 })
              return {
                success: true,
                data: result.tableColVOList,
              }
            }}
          />
        </ProCard>
        <ProCard>
          <div>条件规则配置 <Tooltip title={
            `条件配置规则:
            语法与对应数据源语法保持一致, 规则内容只需填写 where 之后的部分,不需要手动添加where条件.
            示例:  select * from table_name AS ret where #{rule} and b = '2';  补全 #{rule} 部分即可,注:#{rule}部分使用ret做目标表别名`
          }
          > <QuestionCircleTwoTone /></Tooltip> </div>
          <TextArea
            rows={15}
            style={{ marginTop: 10 }}
            value={ruleRaw}
            maxLength={500}
            onChange={e => setRuleRaw(e.target.value)}
          />
          <Row justify="end">
            <Col>
              <Space style={{ marginTop: 20 }}>
                <Button onClick={() => setRuleRaw('')}> 清空 </Button>
                <Button type="primary" onClick={() => onCheckRule()}> 校验 </Button>
              </Space>
            </Col>
          </Row>
        </ProCard>
      </ProCard>
    </Modal>
  )
}
