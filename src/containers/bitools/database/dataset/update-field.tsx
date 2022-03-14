import { Form, Modal, Row, Col, Input } from 'antd'
import useMonitorUrl from '@/hooks/use-monitor-url'

type ValuesType = { [key: string]: any }

export interface UpdateFieldProps {
  matchDw: boolean
  values: ValuesType
  tagList: { id: string, name: string, tagAlias: string }[]
  onOk: (values: ValuesType) => Promise<void>
  onCancel: (...arg: unknown[]) => void
}

const formItemLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 16 },
}

const UpdateField: React.FC<UpdateFieldProps> = ({ matchDw, values, onCancel, onOk }) => {
  const [form] = Form.useForm()
  const monitorUrl = useMonitorUrl('/monitor/norm/business-manage')

  return (
    <Modal
      visible
      title="修改字段"
      width={800}
      okText="确定"
      cancelText="取消"
      onCancel={onCancel}
      onOk={() => {
        const values = form.getFieldsValue()
        onOk(values)
      }}
    >
      <Form
        {...formItemLayout}
        form={form}
        initialValues={values}
      >
        <Row gutter={14}>
          <Col span={18}>
            <Form.Item name="name" label="字段名称">
              <Input disabled />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={14}>
          <Col span={18}>
            <Form.Item name="type" label="字段类型">
              <Input disabled />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={14}>
          <Col span={18}>
            <Form.Item name="alias" label="别名">
              <Input disabled={matchDw === true} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={14}>
          <Col span={18}>
            <Form.Item name="tagAlias" label="业务指标名" help="基于模型和数据集字段映射关系获取字段对应的业务指标名称">
              <Input disabled />
            </Form.Item>
          </Col>
          {matchDw
            ? <Col span={6}>
              未匹配到已有业务指标，我要<a href={monitorUrl}>新建业务指标</a>
            </Col>
            : null}
        </Row>
        <Row gutter={14}>
          <Col span={18}>
            <Form.Item
              name="tagRemark"
              label="指标名备注"
              help="前端展示效果业务指标名称（指标备注），实例：目标看板-预估毛利（已减扣人力成本）"
            >
              <Input disabled={!values.tagName} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={14}>
          <Col span={18}>
            <Form.Item name="desc" label="字段口径">
              <Input disabled={matchDw} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

export default UpdateField
