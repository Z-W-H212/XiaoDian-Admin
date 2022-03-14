import { useState, useEffect, useCallback } from 'react'
import { Form, TreeSelect, Input, Radio, Modal } from 'antd'
import { getTreeGroups } from '@/services/reportService'

const formLayout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 16 },
}

/**
 *
 * @param {*} param0
 * @returns {CopyReportModal} 复制弹窗
 */
const CopyReportModal = ({ groupData, isAdmin, values, onSubmit, ...otherProps }) => {
  const [bizType, setBizType] = useState(values.bizType)
  const [tree, setTree] = useState([...groupData]) // 目标文件数据
  const [form] = Form.useForm()
  const fetchTreeData = useCallback(async () => {
    const result = await getTreeGroups({
      bizType,
      needPersonalNode: 1,
      needRootNode: 1,
      needStaticsReportSize: 1,
      needArchiveNode: 1,
    })
    setTree(result)
  }, [bizType])

  useEffect(() => {
    if (bizType === '1') {
      fetchTreeData()
    } else {
      setTree(groupData)
    }
  }, [bizType, fetchTreeData, form, groupData])

  return (
    <Modal
      destroyOnClose
      title="复制报表"
      width={700}
      onOk={async (e) => {
        const fields = await form.validateFields()
        await onSubmit({ ...values, ...fields })
      }}
      {...otherProps}
    >
      <Form
        initialValues={{ ...values }}
        {...formLayout}
        form={form}
      >
        <Form.Item
          label="文件名称"
          rules={[
            { required: true, message: '请填写文件名称!' },
            { max: 40, message: '字段最长40个字符' },
          ]}
          required
          name="title"
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="文件类型"
          required
          name="bizType"
        >
          <Radio.Group
            onChange={(e) => {
              setBizType(e.target.value)
              form.resetFields(['groupId'])
            }}
          >
            <Radio value="0">报表</Radio>
            <Radio value="1" disabled={!isAdmin}>接口</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          name="groupId"
          required
          label="目标文件夹"
          rules={[
            { required: true, message: '请选择目标文件夹!' },
          ]}
        >
          <TreeSelect
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
            treeData={tree && tree.length > 0 ? tree[0].children.slice(1) : []}
            placeholder="请选择"
            treeDefaultExpandAll
            showSearch
            treeNodeFilterProp="title"
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CopyReportModal
