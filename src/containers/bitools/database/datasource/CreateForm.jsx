import { useMemo } from 'react'
import { Modal, Form, Select, Input, Button, message, InputNumber, Radio } from 'antd'
import { testSource } from '@/services/datasource'

const formItemLayout = {
  labelCol: {
    sm: { span: 7 },
  },
  wrapperCol: {
    sm: { span: 16 },
  },
}

/**
 * 报表创建
 */
const CreateForm = (props) => {
  const { modalVisible, onCancel, onSubmit } = props
  const [form] = Form.useForm()

  const handleClickSubmit = async () => {
    try {
      const fieldsValue = await form.validateFields()
      onSubmit({ ...props.values, ...fieldsValue })
    } catch (err) {
      message.error(err)
    }
  }

  const handleClickTest = async () => {
    try {
      const values = await form.validateFields()
      await testSource(values)
      message.success('测试通过')
    } catch (err) {
      message.error('测试失败', err)
    }
  }

  const itemDataSource = useMemo(() => {
    const keys = ['MySQL', 'ODPS', 'PostgreSQL', 'TiDB']
    return keys.map(key => (
      <Select.Option key={key} vlaue={key}>{key}</Select.Option>
    ))
  }, [])

  return (
    <Modal
      destroyOnClose
      title="新增数据源"
      visible={modalVisible}
      onCancel={() => onCancel()}
      footer={<>
        <Button onClick={() => handleClickTest()}>测试SQL</Button>
        <Button type="primary" onClick={() => handleClickSubmit()}>完成</Button>
      </>}
    >
      <Form
        preserve
        form={form}
        {...formItemLayout}
        initialValues={{ ...props.values, online: props.values.online === null ? 1 : props.values.online }}
      >
        <Form.Item label="数据源类型" name="type"><Select>{itemDataSource}</Select></Form.Item>
        <Form.Item label="数据源名称" required name="name"><Input /></Form.Item>
        <Form.Item label="数据源描述" name="comment"><Input /></Form.Item>
        <Form.Item label="jdbcUrl" required name="jdbcUrl"><Input /></Form.Item>
        <Form.Item label="username" required name="username"><Input /></Form.Item>
        <Form.Item label="password" required name="password"><Input /></Form.Item>
        <Form.Item label="连接池大小" required name="poolSize"><Input /></Form.Item>
        <Form.Item label="最小连接数" required name="minSize"><Input /></Form.Item>
        <Form.Item label="上下线" required name="online">
          <Radio.Group>
            <Radio value={0}>下线</Radio>
            <Radio value={1}>上线</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="timeout" required name="timeout"><InputNumber /></Form.Item>
        <Form.Item label="testSQL" required name="testSQL"><Input.TextArea rows={4} /></Form.Item>
      </Form>
    </Modal>
  )
}

export default CreateForm
