import { Modal, Form } from 'antd'

const formLayout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 16 },
}

interface Props {
  onCancel (): void
  onSubmit (values: unknown): void
  children: any
  values?: Record<string, unknown>
  visible?: boolean
  title: string
  initialValues?: unknown
  formRef?: void
  [key: string]: unknown
}

export function ModalForm (props: Props) {
  const {
    onCancel,
    onSubmit,
    values,
    children,
    visible,
    title,
    initialValues,
    formRef,
    ...otherProps
  } = props

  const [form] = Form.useForm()
  return (
    <Modal
      destroyOnClose
      title={title}
      width={800}
      visible={visible}
      onCancel={onCancel}
      onOk={async (e) => {
        const fields = await form.validateFields()
        await onSubmit({ ...values, ...fields })
      }}
      {...otherProps}
    >
      <Form
        initialValues={initialValues}
        {...formLayout}
        form={form}
      >
        {children}
      </Form>
    </Modal>
  )
}
