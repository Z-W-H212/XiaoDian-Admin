import { useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import { Modal, Form, Input } from 'antd'
import { DataSourceItem, BaseConfigModalProps } from './types'
import { getUuid } from './index'

const BaseConfigModal = (props: BaseConfigModalProps, ref: any) => {
  const { dataSource } = props
  const [visible, setVisible] = useState<boolean>(false)
  const [activeItem, setItem] = useState<DataSourceItem | undefined>()
  const [formInstance] = Form.useForm()

  useImperativeHandle(ref, () => ({
    show (item?: DataSourceItem) {
      setVisible(true)
      setItem(item)
      formInstance.resetFields()
      formInstance.setFieldsValue({ ...item })
    },
  }), [ref])

  const onOk = () => {
    formInstance.validateFields().then((values) => {
      setVisible(false)
      props.onOk(activeItem ? 'edit' : 'add', { ...(activeItem || {}), ...values, uuid: activeItem ? activeItem.uuid : getUuid() })
    })
  }

  const repeatValidator = useCallback((key) => {
    return (_, value) => {
      for (const val of dataSource) {
        if (val.uuid !== activeItem?.uuid && value && value === val[key]) {
          return Promise.reject(new Error('重复'))
        }
      }
      return Promise.resolve()
    }
  }, [dataSource, activeItem])

  return (
    <Modal
      title="应用端管理"
      visible={visible}
      onCancel={() => setVisible(false)}
      onOk={onOk}
    >
      <Form
        name="baseConfigForm"
        labelCol={{ sm: { span: 6 } }}
        wrapperCol={{ sm: { span: 18 } }}
        form={formInstance}
      >
        <Form.Item
          label="应用端名称"
          name="appName"
          rules={[
            { required: true, message: '请输入应用端名称' },
            { validator: repeatValidator('appName'), message: '该名称已存在' },
          ]}
        >
          <Input placeholder="输入应用端名称" />
        </Form.Item>
        <Form.Item
          label="应用端id"
          name="appCode"
          rules={[
            { validator: repeatValidator('appCode'), message: '该id已存在' },
          ]}
        >
          <Input placeholder="输入应用端id" disabled={!!activeItem} />
        </Form.Item>
        <Form.Item
          label="描述"
          name="description"
          rules={[
            { max: 128, message: '最大长度128' },
          ]}
        >
          <Input.TextArea />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default forwardRef(BaseConfigModal)
