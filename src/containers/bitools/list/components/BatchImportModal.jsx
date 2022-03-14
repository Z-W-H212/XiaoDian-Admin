import { useState } from 'react'
import { Button, Modal, Form, Upload, Steps, message, TreeSelect } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { env } from '@/env/admin'
import EditableTable from './EditableTable'

const formLayout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 16 },
}

/**
 *
 * @param {*} param0
 * @returns {BatchImportModal} 批量导入窗口
 */
const BatchImportModal = ({ visible, values, onSubmit, onCancel, treeData, ...otherProps }) => {
  const [fileList, setFileList] = useState([])
  const [uploadError, setUploadError] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [form] = Form.useForm()
  const [formVals, setFormVals] = useState({})

  const forward = () => setCurrentStep(currentStep + 1)

  const backward = () => setCurrentStep(currentStep - 1)

  /**
   * 批量导入：完成/下一步
   */
  const handleNext = async () => {
    try {
      const fieldsValue = await form.validateFields()
      if (currentStep === 0) {
        const uploadFailed = fieldsValue.upload.fileList.filter(i => i.status !== 'done' || !i.response.success)
        if (uploadFailed && uploadFailed.length || !fieldsValue.upload.fileList.length) {
          throw Error()
        }
      }

      if (currentStep === 1) {
        const errorRow = fieldsValue.importList.find(e => !e.targetSourceName)
        if (errorRow) {
          message.error(`请选择 ${errorRow.name} 的目标数据库`)
          throw Error()
        }
      }

      setFormVals({ ...formVals, ...fieldsValue })

      if (currentStep < 2) {
        forward()
      } else {
        onSubmit({ ...formVals, ...fieldsValue })
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
    }
  }

  // 文件上传判定
  const handleUploading = async ({ file, fileList }) => {
    setFileList(fileList)

    if (file.status === 'uploading') {
      setUploadError({
        validateStatus: 'validating',
        help: '上传中',
      })
      return
    }

    if (file.status === 'error') {
      setUploadError({
        validateStatus: 'error',
        help: `${file.name} 上传失败`,
      })
      return
    }

    if (fileList.length === 0) {
      setUploadError({
        validateStatus: 'error',
        help: '请上传文件',
      })
      return
    }

    if (file.status === 'done' && !file.response.success) {
      setUploadError({
        validateStatus: 'error',
        help: file.response.msg || '上传失败',
      })
      return
    }

    setUploadError(null)
    if (file.response) {
      form.setFieldsValue({
        importList: file.response.data.recordList,
        taskKey: file.response.data.taskKey,
      })
    }
    message.success(`${file.name} 上传成功`)

    await handleNext()
  }

  const renderContent = () => {
    if (currentStep === 1) {
      // checkStatus 状态废弃
      return (
        <>
          <Form.Item name="taskKey" hidden />
          <Form.Item
            wrapperCol={{ span: 24 }}
            style={{ margin: '16px 0' }}
            name="importList"
          >
            <EditableTable />
          </Form.Item>
        </>
      )
    }

    if (currentStep === 2) {
      return (
        <Form.Item
          label="目标文件夹"
          name="groupId"
          rules={[
            { required: true, message: '请选择目标文件夹!' },
          ]}
        >
          <TreeSelect
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
            treeData={treeData[0]?.children.slice(1)}
            placeholder="请选择"
            treeDefaultExpandAll
          />
        </Form.Item>
      )
    }
    return (
      <>
        <Form.Item
          label="导入文件"
          validateFirst
          rules={[
            { required: true, message: '请上传文件!' },
          ]}
          name="upload"
          style={{ padding: '40px 0' }}
          {...uploadError}
        >
          <Upload
            beforeUpload={(e) => {
              const l20MB = 20 * 1024 * 1024
              if (e.size >= l20MB) {
                message.error('文件过大，请不要超过20MB')
                return false
              }
              return true
            }}
            onChange={handleUploading}
            name="file"
            fileList={fileList}
            withCredentials
            action={`${env.dcapi}/diana/report/v1/batchImport/${values.bizType}`}
          >
            {fileList && fileList.length === 0
              ? (
                <Button><UploadOutlined /> 点击上传文件</Button>
              )
              : null}
          </Upload>
        </Form.Item>
      </>
    )
  }

  const renderFooter = () => {
    if (currentStep === 1) {
      return (
        <>
          <Button style={{ float: 'left' }} onClick={backward}>
            上一步
          </Button>
          <Button onClick={() => onCancel()}>
            取消
          </Button>
          <Button type="primary" onClick={() => handleNext()}>
            下一步
          </Button>
        </>
      )
    }
    if (currentStep === 2) {
      return (
        <>
          <Button style={{ float: 'left' }} onClick={backward}>
            上一步
          </Button>
          <Button onClick={() => onCancel()}>
            取消
          </Button>
          <Button type="primary" onClick={() => handleNext()}>
            完成
          </Button>
        </>
      )
    }
    return (
      <>
        <Button onClick={() => onCancel()}>
          取消
        </Button>
        <Button type="primary" onClick={async () => await handleNext()}>
          下一步
        </Button>
      </>
    )
  }

  return (
    <Modal
      width={1000}
      bodyStyle={{ padding: '24px 24px 6px' }}
      destroyOnClose
      title="批量导入"
      visible={visible}
      footer={renderFooter()}
      onCancel={() => onCancel()}
    >
      <Steps
        style={{ margin: '0 auto 28px', width: '80%' }}
        size="small"
        current={currentStep}
      >
        <Steps.Step title="上传文件" />
        <Steps.Step title="查看导入结果" />
        <Steps.Step title="配置文件路径" />
      </Steps>

      <Form
        {...formLayout}
        form={form}
      >
        {renderContent()}
      </Form>
    </Modal>
  )
}

export default BatchImportModal
