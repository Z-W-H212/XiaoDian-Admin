/* eslint-disable no-console */
/* eslint-disable eqeqeq */
import { useState } from 'react'
import { Button, Modal, Form, Input } from 'antd'

type ValueType = { [key: string]: string }
type OrgProp = {
  value: ValueType
  config: unknown;
  onChange: (value: ValueType) => void
}

export default function Organization (props: OrgProp) {
  const { value, onChange } = props
  const [form] = Form.useForm()
  const [visible, setVisible] = useState(false)
  console.log(value)

  return (
    <div>
      <Button onClick={() => setVisible(true)}>
        {value ? `userId: ${value.userId}, deptId: ${value.deptId}` : '请选择组织架构'}
      </Button>
      <Modal
        visible={visible}
        title="Create a new collection"
        okText="Create"
        cancelText="Cancel"
        onCancel={() => setVisible(false)}
        onOk={() => {
          form
            .validateFields()
            .then((values) => {
              onChange(values)
              setVisible(false)
            })
            .catch((info) => {
              console.log('Validate Failed:', info)
            })
        }}
      >
        <Form
          form={form}
          layout="vertical"
          name="form_in_modal"
          initialValues={{ modifier: 'public' }}
        >
          <Form.Item name="userId" label="userId" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="deptId" label="deptId" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
