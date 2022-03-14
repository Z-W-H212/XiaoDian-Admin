import { forwardRef, useImperativeHandle, useEffect, useMemo, useState, createRef, useCallback } from 'react'
import { Form } from '@ant-design/compatible'
import '@ant-design/compatible/assets/index.css'
import { Input, Select, Modal, Radio, Button, Table, Popconfirm, Row, Col, Switch, Checkbox, Tooltip } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import useFetch from '@/hooks/useFetch'
import { getDataTypeList } from '@/services/databaseService'
import { getTagList, matchTag } from '@/services/admin/databse'
import useMonitorUrl from '@/hooks/use-monitor-url'

const formItemLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 16 },
}

const timePeriodList = ['历史累计', '本月', '上月', '上上月', '本周', '上周', '上上周', '当日', '最近1天', '最近7天', '最近30天', '7天前']

/**
 * 添加/编辑报表
 */
const CreateFieldModal = Form.create({ name: 'form_in_modal' })(forwardRef((props, ref) => {
  const { visible, defaultValues, onCancel, form, fieldList, onSubmit } = props
  const { getFieldDecorator, getFieldsValue, setFieldsValue, resetFields, getFieldValue } = form
  const [{ data: fieldTypeOptions }, fetchType] = useFetch(getDataTypeList, { data: [] })
  const [tagListRes, fetchTagList] = useFetch(getTagList, { data: [] })

  const [fieldData, setFieldData] = useState({ ...defaultValues, tagTimePeriod: undefined })
  const isMatchTag = useMemo(() => {
    return tagListRes.data.length > 0 ? !!tagListRes.data[0].isMatch : false
  }, [tagListRes.data])
  const monitorUrl = useMonitorUrl('/monitor/norm/business-manage')

  useImperativeHandle(ref, () => ({ form }))
  useEffect(() => {
    if (!fieldTypeOptions.length) {
      fetchType()
    }
    resetFields()
    setColType(defaultValues?.colType)
    setFieldData(defaultValues || {})
    if (!defaultValues) {
      return
    }
    // 判断完isNumber之后再进行 get -> set  防止 ifRateIndex 和 ifCalSamePeriodCompare 设置不上初始值
    setTimeout(() => {
      const values = getFieldsValue()
      Object.keys(values).forEach(k => (values[k] = defaultValues ? defaultValues[k] : ''))
      setFieldsValue(values)
    })
  }, [defaultValues, fieldList, visible])

  useEffect(() => {
    fetchTagList({})
  }, [])

  const updateFields = useCallback(async (fieldData, type) => {
    const { colName, colAlias } = fieldData
    let tagItem
    if (type === 'tagName') {
      tagItem = tagListRes.data.find(item => item.name === fieldData.tagName)
    } else if (colName) {
      const tagList = tagListRes.data
      const { name, tagAlias } = await matchTag(colName, colAlias)
      tagItem = tagList.find((item) => {
        return name === item.name || tagAlias === item.tagAlias
      })
    }
    const values = getFieldsValue()
    if (tagItem) {
      values.tagId = tagItem.id
      values.tagName = tagItem.name
      values.tagAlias = tagItem.tagAlias
      values.colDesc = tagItem.colDesc
      setFieldsValue(values)
    } else {
      resetFields(['tagId', 'tagName', 'tagAlias', 'colDesc', 'tagRemark'])
    }
  }, [tagListRes.data])

  /**
   * 重名校验
   * @param {*} rule 校验参数
   * @param {*} value 输入值
   * @returns 校验信息
   */
  function checkFieldExist (rule, value, callback) {
    const errors = []
    if (rule.field === 'colName' && !!defaultValues) {
      return callback(errors)
    }
    const hasField = fieldList.find((e) => {
      // 编辑模式下跳过和当前ID相同的字段，不然会和自己冲突
      if (e.sequence === defaultValues?.sequence) {
        return false
      }

      return e[rule.field] === value
    })
    if (hasField) {
      errors.push(new Error(rule.message))
    }
    callback(errors)
  }

  const [colType, setColType] = useState(defaultValues?.colType)
  const isNumber = useMemo(() => {
    // 判断 字段类型 是否为数值型
    return ['INTEGER', 'DECIMAL', 'LONG', 'FLOAT', 'DOUBLE'].includes(colType)
  }, [colType])

  const onColTypeChange = (value) => {
    setColType(value)
    // 字段类型改变重置 ifRateIndex ifCalSamePeriodCompare
    isNumber && resetFields(['ifRateIndex', 'ifCalSamePeriodCompare'])
  }

  // 个性设置提交保存
  const onCustomConfigSubmit = (customConfig) => {
    // 保存到隐藏的表单项  在整个表单提交时 自动提交给父组件
    setFieldsValue({
      customConfig,
    })
    setFieldData({
      ...fieldData,
      customConfig: [...customConfig],
    })
  }

  const handleIfChange = () => {
    // 当 ifRateIndex ifCalSamePeriodCompare 改变时  将数据同步给 CustomParams 用于判重
    setTimeout(() => {
      setFieldData(getFieldsValue())
    })
  }

  const timePeriodOptions = useMemo(() => {
    return timePeriodList.map((value) => {
      return <Select.Option key={value} value={value}>{value}</Select.Option>
    })
  }, [])

  const tagNameOptions = useMemo(() => {
    return tagListRes.data?.map(({ id, name, tagAlias }) => {
      return <Select.Option key={id} value={name}>{tagAlias || name}</Select.Option>
    })
  }, [tagListRes.data])

  return (
    <Modal
      title="字段信息配置"
      visible={visible}
      width={600}
      onCancel={onCancel}
      onOk={onSubmit}
    >
      <Form {...formItemLayout}>
        <Row>
          <Col span={18}>
            <Form.Item label="字段名称">
              {getFieldDecorator('colName', {
                rules: [
                  { max: 30, message: '字段最长30个字符' },
                  { required: true, message: '请输入字段名称' },
                  { validator: checkFieldExist, message: '该字段名已存在' },
                ],
              })(<Input
                disabled={!!defaultValues}
                onBlur={e => updateFields({ ...getFieldsValue(), colName: e.target.value })}
              />)}
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="前端展示" labelCol={{ span: 12 }}>
              {getFieldDecorator('isShow', {
                initialValue: true,
                valuePropName: 'checked',
              })(<Switch />)}
            </Form.Item>
          </Col>
        </Row>
        <Col span={18}>
          <Form.Item label="字段别名">
            {getFieldDecorator('colAlias', {
              rules: [
                { max: 40, message: '字段最长40个字符' },
                { required: true, message: '请输入字段别名' },
                { validator: checkFieldExist, message: '该字段别名已存在' },
              ],
            })(<Input
              disabled={defaultValues?._source === 'parse' && defaultValues.tagName}
              onBlur={e => updateFields({ ...getFieldsValue(), colAlias: e.target.value })}
            />)}
          </Form.Item>
          <Form.Item label="字段类型">
            {getFieldDecorator('colType', {
              rules: [
                { required: true, message: '请选择字段类型' },
              ],
            })(<Select onChange={onColTypeChange}>
              {fieldTypeOptions.map(value => <Select.Option key={value}>{value}</Select.Option>)}
            </Select>)}
          </Form.Item>
        </Col>
        {isNumber
          ? <>
            <Form.Item label="是否比率指标">
              {getFieldDecorator('ifRateIndex', {
                initialValue: false,
              })(<Radio.Group onChange={handleIfChange}>
                <Radio value>是</Radio>
                <Radio value={false}>否</Radio>
              </Radio.Group>)}
            </Form.Item>
            <Form.Item label="是否计算同环比">
              {getFieldDecorator('ifCalSamePeriodCompare', {
                initialValue: false,
              })(<Radio.Group onChange={handleIfChange}>
                <Radio value>是</Radio>
                <Radio value={false}>否</Radio>
              </Radio.Group>)}
            </Form.Item>
            <Row>
              <Col span={18}>
                <Form.Item
                  label="小数位数"
                >
                  {getFieldDecorator('decimal', {
                    rules: [
                      {
                        validator (_, value) {
                          if (!value || /^(|0|[1-9][0-9]*)$/.test(value)) {
                            return Promise.resolve()
                          }
                          return Promise.reject(new Error(''))
                        },
                        message: '仅支持自然数，即>=0的整数',
                      },
                    ],
                  })(<Input
                    suffix={
                      <Tooltip title="保留几位小数，输入自然数（大于等于0的整数）">
                        <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
                      </Tooltip>
                    }
                  />)}
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item>
                  {getFieldDecorator('round', {
                    initialValue: false,
                    valuePropName: 'checked',
                  })(<Checkbox onChange={handleIfChange}>四舍五入</Checkbox>)}
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="千位分隔符">
              {getFieldDecorator('separator', {
                initialValue: false,
              })(<Radio.Group onChange={handleIfChange}>
                <Radio value={false}>关闭</Radio>
                <Radio value>开启</Radio>
              </Radio.Group>)}
            </Form.Item>
          </>
          : null}
        <Row>
          <Col span={18}>
            <Form.Item label="业务指标名称" help="匹配已有的业务指标名称">
              {getFieldDecorator('tagName', {})(
                <Select
                  allowClear
                  showSearch
                  disabled={defaultValues?._source === 'parse'}
                  placeholder="请选择"
                  filterOption={(input, option) => {
                    const str = String(option.children).toLowerCase()
                    return str.includes(input.toLowerCase())
                  }}
                  onSelect={(value) => {
                    updateFields({ ...getFieldsValue(), tagName: value }, 'tagName')
                  }}
                  onClear={() => updateFields({ ...getFieldsValue(), tagName: undefined }, 'tagName')}
                >
                  {tagNameOptions}
                </Select>,
              )}
            </Form.Item>
            <Form.Item label="时间修饰词">
              {getFieldDecorator('tagTimePeriod', {})(
                <Select
                  allowClear
                  placeholder="无"
                >
                  {timePeriodOptions}
                </Select>,
              )}
            </Form.Item>
          </Col>
          {isMatchTag
            ? <Col span={6}>
              未匹配到已有业务指标，我要<a href={monitorUrl}>新建业务指标</a>
            </Col>
            : null}
        </Row>
        <Col span={18}>
          <Form.Item label="指标名称备注" help="前端展示业务指标名称（指标备注），示例：目标看板-预估毛利（已减口人力成本）">
            {getFieldDecorator('tagRemark', {})(<Input disabled={!getFieldValue('tagName')} />)}
          </Form.Item>
        </Col>
        <Col span={18}>
          <Form.Item label="口径说明">
            {getFieldDecorator('colDesc', {
              rules: [{ max: 200, message: '字段最长200个字符' }],
            })(<Input.TextArea max={200} rows={3} disabled={getFieldValue('tagName')} />)}
          </Form.Item>
        </Col>

        {/* 创建一个隐藏项 用于自动传值给父组件 */}
        <Form.Item label="个性设置" style={{ display: 'none' }}>
          {getFieldDecorator('customConfig')(<Input />)}
        </Form.Item>
        <Form.Item style={{ display: 'none' }}>
          {getFieldDecorator('tagId')(<Input />)}
        </Form.Item>
        <Form.Item style={{ display: 'none' }}>
          {getFieldDecorator('tagAlias')(<Input />)}
        </Form.Item>
      </Form>
      <CustomParams
        fieldData={fieldData}
        isNumber={isNumber}
        onSubmit={onCustomConfigSubmit}
      />
    </Modal>
  )
}))

export default CreateFieldModal

function CustomParams (props) {
  const formRef = createRef()
  const [modalVisible, setModalVisible] = useState(false) // 编辑窗口是否展示
  const [editRowIndex, setEditRowIndex] = useState(null) // 编辑模式下对应编辑行的下标，null则为创建
  const [formDefaultValues, setFormDefaultValues] = useState(null) // 编辑模式下，表单预设值

  const { fieldData, onSubmit, isNumber } = props
  const columns = [
    { key: 'key', dataIndex: 'key', title: '属性名称' },
    { key: 'value', dataIndex: 'value', title: '属性值' },
    {
      key: 'other',
      dataIndex: 'other',
      title: '操作',
      width: 96,
      align: 'center',
      fixed: 'right',
      render: (value, row) => (
        <div>
          <a onClick={() => onEdit(row)}>编辑</a> &nbsp;
          <Popconfirm title="确定要删除?" onConfirm={() => onDelete(row)}>
            <a>删除</a>
          </Popconfirm>
        </div>
      ),
    },
  ]

  // 给 个性设置 列表 添加索引
  const customConfig = (fieldData.customConfig || []).map((item, i) => ({ ...item, i }))

  // 进入编辑状态 填充表单预设
  useEffect(() => {
    setFormDefaultValues(editRowIndex !== null ? customConfig[editRowIndex] : null)
  }, [editRowIndex, fieldData.customConfig])

  const handleClickAdd = () => {
    setModalVisible(true)
    setEditRowIndex(null)
  }

  const onEdit = (row) => {
    setModalVisible(true)
    setEditRowIndex(row.i)
  }

  const onDelete = (row) => {
    fieldData.customConfig.splice(row.i, 1)
    onSubmit(fieldData.customConfig)
  }

  const onSubmitModal = () => {
    const { validateFields } = formRef.current?.form
    validateFields(null, { force: true }, (err, values) => {
      if (err) return
      const customConfig = fieldData.customConfig || []
      // 新建
      if (editRowIndex === null) {
        customConfig.push(values)
      } else {
        // 编辑
        customConfig[editRowIndex] = values
      }
      onCancel()
      onSubmit(customConfig)
    })
  }

  const onCancel = () => {
    setEditRowIndex(null)
    setModalVisible(false)
  }

  return (
    <div>
      <div>个性配置</div>
      <Table size="middle" columns={columns} dataSource={customConfig} />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <Button type="primary" onClick={handleClickAdd}>添加配置</Button>
      </div>
      <CreateCustomConfigModal
        visible={modalVisible}
        defaultValues={formDefaultValues}
        customConfig={customConfig}
        isNumber={isNumber}
        wrappedComponentRef={formRef}
        onSubmit={onSubmitModal}
        onCancel={onCancel}
      />
    </div>
  )
}

const fieldsConfig = [
  { key: 'colName', label: '字段名称' },
  { key: 'colAlias', label: '字段别名' },
  { key: 'colType', label: '字段类型' },
  { key: 'ifRateIndex', label: '是否比率指标', isNumber: true },
  { key: 'ifCalSamePeriodCompare', label: '是否计算同环比', isNumber: true },
  { key: 'decimal', label: '小数位数' },
  { key: 'round', label: '四舍五入' },
  { key: 'separator', label: '千位分隔符', isNumber: true },
  { key: 'colDesc', label: '口径说明' },
  { key: 'isShow', label: '前端展示' },
  { key: 'customConfig', label: '个性配置' },
]
const CreateCustomConfigModal = Form.create({ name: 'CreateCustomConfigModal' })(forwardRef((props, ref) => {
  const { visible, defaultValues, customConfig, isNumber, onCancel, onSubmit, form } = props
  const { getFieldDecorator, getFieldsValue, setFieldsValue, resetFields } = form

  useImperativeHandle(ref, () => ({ form }))
  useEffect(() => {
    resetFields()
    if (!defaultValues) return

    const values = getFieldsValue()
    Object.keys(values).forEach(k => (values[k] = defaultValues[k]))
    setFieldsValue(values)
  }, [defaultValues, customConfig])

  /**
   * 校验是否重复
   * @param {*} value 属性值
   * @returns 校验提示
   */
  const repeatValidator = (_, value) => {
    for (const val of fieldsConfig) {
      if (!val.isNumber || (val.isNumber && isNumber)) {
        if (value === val.label) {
          return Promise.reject(new Error(`该属性名称已存在【${val.label}】`))
        } else if (value === val.key) {
          return Promise.reject(new Error(`该属性名称已存在【${val.label}(${val.key})】`))
        }
      }
    }

    const hasField = customConfig.find((item) => {
      // 编辑模式下跳过和当前i相同的字段 不然会和自己冲突
      if (defaultValues && item.i === defaultValues.i) {
        return false
      }

      return item.key === value
    })
    if (hasField) {
      return Promise.reject(new Error('该属性名称已存在'))
    }
    return Promise.resolve()
  }

  return (
    <Modal
      title="个性配置"
      visible={visible}
      onOk={onSubmit}
      onCancel={onCancel}
    >
      <Form {...formItemLayout}>
        <Form.Item label="属性名称">
          {getFieldDecorator('key', {
            rules: [
              { max: 30, message: '字段最长30个字符' },
              { required: true, message: '请输入属性名称' },
              repeatValidator,
            ],
          })(<Input />)}
        </Form.Item>
        <Form.Item label="属性值">
          {getFieldDecorator('value')(<Input />)}
        </Form.Item>
      </Form>
    </Modal>
  )
}))
