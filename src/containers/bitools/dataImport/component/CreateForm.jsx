import { useState, useEffect } from 'react'
import { Form, Button, Input, Modal, Select, Steps, message } from 'antd'
import { queryTemplateDBs, queryTemplateTables, queryTemplateFields } from '@/services/dataImportService'
import EditableTable from './EditableTable'

const formLayout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 16 },
}

/**
 *
 * @param {*} props
 * @returns {CreateForm} 新建/编辑模型配置
 */
const CreateForm = (props) => {
  const [databaseList, setDatabaseList] = useState([])
  const [tableList, setTableList] = useState([])
  const [formVals, setFormVals] = useState({
    name: props.values.name, // 模型名称
    targetDatabase: props.values.targetDatabase, // 数据源库
    targetTable: props.values.targetTable, // 数据源表
    comment: props.values.comment, // 模型描述
    readmeText: props.values.readmeText, // 模型说明
    fieldList: props.values.fieldList, // 字段列表
  })

  const isEditMode = !!props.values.id

  const [currentStep, setCurrentStep] = useState(isEditMode ? 1 : 0)
  const [form] = Form.useForm()

  /**
   * 父子组件传值
   */
  const {
    onSubmit: handleSubmit,
    onCancel: handleModalVisibleChange,
    modalVisible,
    values,
  } = props

  const forward = () => setCurrentStep(currentStep + 1)

  const backward = () => setCurrentStep(currentStep - 1)

  /**
   * 根据currentStep确定提交还是下一步
   */
  const handleNext = async () => {
    try {
      const fieldsValue = await form.validateFields()

      setFormVals({ ...formVals, ...fieldsValue })

      if (currentStep < 1) {
        forward()
      } else {
        handleSubmit({ ...formVals, ...fieldsValue, id: props.values.id })
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
    }
  }

  useEffect(() => {
    queryTemplateDBs().then(res => setDatabaseList(res))
  }, [])

  useEffect(() => {
    if (currentStep === 1) {
      // 如果不是编辑状态（创建），需要拉一下初始模型信息（字段列表）
      if (!isEditMode) {
        queryTemplateFields({
          targetTable: formVals.targetTable,
          targetDatabase: formVals.targetDatabase,
        })
          .then((res) => {
            const findTable = tableList.find(e => (e.tableName === formVals.targetTable))
            form.setFieldsValue({
              name: formVals.name || findTable.tableAlias || findTable.tableName,
              fieldList: res,
            })
          })
          .catch((err) => {
            message.error(err)
          })
      }
    }
  }, [currentStep, form, formVals, isEditMode, tableList])

  /**
   * @returns {renderContent} 根据currentStep渲染表单DOM数据
   */
  const renderContent = () => {
    if (currentStep === 1) {
      return (
        <>
          <Form.Item label="模型关联数据表">
            <Form.Item style={{ display: 'inline-block', width: 'calc(50% - 8px)' }} name="targetDatabase">
              <Select disabled />
            </Form.Item>
            <Form.Item style={{ display: 'inline-block', width: 'calc(50% - 8px)', marginLeft: '16px' }} name="targetTable">
              <Select disabled />
            </Form.Item>
          </Form.Item>
          <Form.Item
            name="name" label="模型名称" rules={[{ required: true, message: '请填写模型名称!' }, { max: 40, message: '字段最长40个字符' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="comment" label="模型描述" rules={[{ max: 512, message: '字段最长512个字符' }]}
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="readmeText" label="填写说明">
            <Input.TextArea />
          </Form.Item>
          <Form.Item wrapperCol={{ span: 24 }} style={{ margin: '16px 0' }} name="fieldList">
            <EditableTable />
          </Form.Item>
        </>
      )
    }
    return (
      <>
        <Form.Item label="模型关联数据表" style={{ marginBottom: 0 }}>
          <Form.Item
            name="targetDatabase"
            validateFirst
            rules={[{ required: true, message: '请选择数据库!' }]}
            style={{ display: 'inline-block', width: 'calc(50% - 8px)' }}
          >
            <Select
              onChange={async (e) => {
                form.setFieldsValue({ targetTable: null })
                setTableList(await queryTemplateTables(e))
              }}
            >
              {databaseList.map(e => (<Select.Option key={`db-k-${e}`} value={e}>{e}</Select.Option>))}
            </Select>
          </Form.Item>
          <Form.Item
            style={{ display: 'inline-block', width: 'calc(50% - 8px)', marginLeft: '16px' }}
            name="targetTable"
            rules={[
              ({ getFieldValue }) => ({
                validator (_, value) {
                  if (!value) {
                    return Promise.reject(Error('请选择数据表!'))
                  }
                  return queryTemplateFields({
                    targetDatabase: form.getFieldValue('targetDatabase'),
                    targetTable: value,
                  })
                },
              }),
            ]}
          >
            <Select showSearch disabled={!tableList}>
              {tableList.length && tableList.map(e => (
                <Select.Option key={`tb-id-${e.id}`} value={e.tableName}>{e.tableName}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form.Item>
      </>
    )
  }

  /**
   *
   * @returns {renderFooter} 底部按钮渲染
   */
  const renderFooter = () => {
    if (currentStep === 1) {
      return (
        <>
          {
            !isEditMode && (
              <Button style={{ float: 'left' }} onClick={backward}>
                上一步
              </Button>
            )
          }
          <Button onClick={() => handleModalVisibleChange(false, values)}>取消</Button>
          <Button type="primary" onClick={() => handleNext()}>
            完成
          </Button>
        </>
      )
    }
    return (
      <>
        <Button onClick={() => handleModalVisibleChange(false, values)}>取消</Button>
        <Button type="primary" onClick={() => handleNext()}>
          下一步
        </Button>
      </>
    )
  }

  return (
    <Modal
      width={700}
      bodyStyle={{ padding: '24px 24px 6px' }}
      destroyOnClose
      title="模型配置"
      visible={modalVisible}
      footer={renderFooter()}
      onCancel={() => handleModalVisibleChange()}
    >
      <Steps style={{ margin: '0 auto 28px', width: '80%' }} size="small" current={currentStep}>
        <Steps.Step title="模型关联数据表" />
        <Steps.Step title="模型配置" />
      </Steps>
      <Form
        {...formLayout}
        form={form}
        initialValues={{
          name: formVals.name, // 模型名称
          targetDatabase: formVals.targetDatabase, // 数据源库
          targetTable: formVals.targetTable, // 数据源表
          comment: formVals.comment, // 模型描述
          readmeText: formVals.readmeText, // 模型说明
          fieldList: formVals.fieldList, // 字段列表
        }}
      >
        {renderContent()}
      </Form>
    </Modal>
  )
}

export default CreateForm
