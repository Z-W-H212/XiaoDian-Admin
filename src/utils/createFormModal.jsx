import { Form } from '@ant-design/compatible'
import '@ant-design/compatible/assets/index.css'
import { Modal } from 'antd'

export default function createFormModal (FormComponent) {
  let formValues
  const WrappedForm = Form.create({
    onValuesChange (props, changedValues, allValues) {
      formValues = allValues
    },
  })(FormComponent)

  return function (data, options) {
    formValues = {}

    const pro = new Promise((resolve, reject) => {
      Modal.confirm({
        title: '编辑',
        content: <WrappedForm data={data} options={options} />,
        okText: '确认',
        cancelText: '取消',
        onOk () { resolve(formValues) },
        onCancel () {},
      })
    })

    return pro
  }
}
