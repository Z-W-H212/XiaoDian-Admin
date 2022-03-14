import { useImperativeHandle } from 'react'
import { Modal, Form } from 'antd'

const formLayout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 16 },
}

const BaseModal = ({
  onCancel,
  onSubmit,
  values,
  children,
  visible,
  title,
  initialValues,
  formRef,
  formProps,
  ...otherProps
}) => {
  const [form] = Form.useForm()

  useImperativeHandle(formRef, () => ({
    ...form,
  }))

  return (
    <Modal
      destroyOnClose
      title={title}
      width={700}
      visible={visible}
      onCancel={onCancel}
      onOk={async (e) => {
        const fields = await form.validateFields()
        await onSubmit({ ...values, ...fields })
      }}
      {...otherProps}
    >
      <Form
        initialValues={{ ...initialValues }}
        {...formLayout}
        {...formProps}
        form={form}
      >
        {children}
      </Form>
    </Modal>
  )
}

export default BaseModal
