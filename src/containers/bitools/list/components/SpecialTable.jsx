import { useState, useRef } from 'react'
import ProTable from '@ant-design/pro-table'
import { Button, Modal, Form, Input, Radio, Select, Table, message } from 'antd'
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc'
import { SpecialComponentInsert, SpecialComponentDelete, relatedResource, editResource, getAllSpecialTable } from '@/services/reportService'
import { MenuOutlined } from '@ant-design/icons'
import style from './style.module.less'
import TextArea from 'antd/lib/input/TextArea'

const options = [
  { label: '对象', value: 0 },
  { label: '数组', value: 1 },
]
const arrayOptions = [
  { label: '定长', value: 1 },
  { label: '变长', value: 2 },
]

const dslOptions = [
  { label: 'STRING', value: 'STRING' },
  { label: 'BINARY', value: 'BINARY' },
  { label: 'BOOLEAN', value: 'BOOLEAN' },
  { label: 'INTEGER', value: 'INTEGER' },
  { label: 'DECIMAL', value: 'DECIMAL' },
  { label: 'LONG', value: 'LONG' },
  { label: 'FLOAT', value: 'FLOAT' },
  { label: 'DOUBLE', value: 'DOUBLE' },
  { label: 'DATE', value: 'DATE' },
  { label: 'TIME', value: 'TIME' },
  { label: 'TIMESTRAMP', value: 'TIMESTRAMP' },
  { label: 'DATETIME', value: 'DATETIME' },
  { label: 'OBJ', value: 'OBJ' },
]

const isInputs = [
  { label: '是', value: 'true' },
  { label: '否', value: 'false' },
]

const sourceColumn = [
  {
    key: 'code',
    dataIndex: 'code',
    title: 'code',
  },
  {
    key: 'name',
    dataIndex: 'name',
    title: '资源名称',
  },
  {
    key: 'bizType',
    dataIndex: 'bizType',
    title: '资源类型',
    filters: [
      {
        text: '报表',
        value: 0,
      },
      {
        text: '接口',
        value: 1,
      },
    ],
    onFilter: (value, record) => record.bizType === value,
  },
  {
    key: 'commitUser',
    dataIndex: 'commitUser',
    title: '资源维护人',
  },
]

const DragHandle = SortableHandle(() => <MenuOutlined style={{ cursor: 'pointer', color: '#999' }} />)
export function SpecialTable () {
  const [creatComponent, setCreatComponent] = useState(false)
  const [paramConfig, setParamConfig] = useState(false)
  const [concatSource, setConcatSource] = useState(false)
  const [arrType, setArrType] = useState(1)
  const [dataCom, setDataCom] = useState()
  const [componentType, setComponentType] = useState(0)
  const [formInstance] = Form.useForm()
  const [formConfig] = Form.useForm()
  const [tableData, setTableData] = useState()
  const [dataCol, setDataCol] = useState([])
  const actionRef = useRef()
  const parameterRef = useRef()

  const SortableItem = SortableElement(props => <tr {...props} />)
  const SortContainer = SortableContainer(props => <tbody {...props} />)
  const configColumns = [
    {
      dataIndex: 'sort',
      width: 100,
      className: 'drag-visible',
      render: () => <DragHandle />,
    },
    {
      key: 'codeName',
      dataIndex: 'codeName',
      className: 'drag-visible',
      title: '字段名',
      render (record) {
        return <span style={{ fontSize: '10px' }}>{record}</span>
      },
    },
    {
      key: 'codeAlias',
      dataIndex: 'codeAlias',
      title: '字段别名',
      render (value, row) {
        return <span style={{ fontSize: '10px' }}>{value}</span>
      },
    },
    {
      key: 'codeType',
      dataIndex: 'codeType',
      title: '字段类型',
    },
    {
      key: 'isInput',
      dataIndex: 'isInput',
      title: '是否必填',
      render (record) {
        return <span>{record ? '是' : '否'}</span>
      },
    },
    {
      key: 'config',
      title: '操作',
      render: (record, row) => (
        <>
          <a onClick={() => editParams(row)}>编辑</a> | <a onClick={() => {
            const res = dataCol.filter((item) => { return item.codeName !== row.codeName })
            setDataCol(res)
          }}
          >删除</a>
        </>
      ),
    },
  ]
  const columns = [
    {
      key: 'componentCode',
      dataIndex: 'componentCode',
      title: 'code',
    },
    {
      key: 'componentName',
      dataIndex: 'componentName',
      title: '组件名称',
      render (record) {
        return <span style={{ fontSize: '10px' }}>{record}</span>
      },
    },
    {
      key: 'componentValueType',
      dataIndex: 'componentValueType',
      title: '组件类型',
      render (record) {
        return <span style={{ fontSize: '14px' }}>{record ? '数组' : '对象'}</span>
      },
    },
    {
      key: 'defaultProps',
      dataIndex: 'defaultProps',
      title: '默认参数',
      render (record) {
        return <span style={{ fontSize: '10px' }}>{record}</span>
      },
    },
    {
      key: 'componentKeys',
      dataIndex: 'componentKeys',
      title: '自定义配置',
      render (record) {
        const res = record.reduce((arr, cur) => {
          return `${JSON.stringify(cur)},${arr}`
        }, '')
        return <p style={{ width: '120px', fontSize: '10px' }}>{res}</p>
      },
    },
    {
      key: 'creator',
      dataIndex: 'creator',
      title: '创建人',
    },
    {
      key: 'gmtCreate',
      dataIndex: 'gmtCreate',
      title: '创建时间',
      render (record) {
        return <span style={{ fontSize: '10px' }}>{record}</span>
      },
    },
    {
      key: 'modifier',
      dataIndex: 'modifier',
      title: '更新人',
    },
    {
      key: 'gmtUpdate',
      dataIndex: 'gmtUpdate',
      title: '更新时间',
      render (record) {
        return <span style={{ fontSize: '10px' }}>{record}</span>
      },
    },
    {
      key: 'config',
      title: '操作',
      width: 200,
      fixed: 'right',
      render: (record, row) => (
        <>
          <a onClick={() => {
            setCreatComponent({ id: row.id })
            formInstance.setFieldsValue(row)
            setComponentType(row.componentValueType)
            setDataCol(row.componentKeys)
          }}
          >编辑</a> |
          &nbsp;
          <a onClick={async () => {
            await SpecialComponentDelete(row.id)
            message.success('删除成功')
            await actionRef.current.reload()
          }}
          >删除</a> |
          &nbsp;
          <a
            onClick={async () => {
              const result = await relatedResource(row.componentCode)
              setDataCom(result)
              setConcatSource(true)
            }}
          >已关联资源</a>
        </>
      ),
    },
  ]

  const componentSure = async () => {
    const params = await formInstance.validateFields()
    if (params.componentValueType) {
      const arr = []
      for (let i = 1; i < params?.valueLength; i++) {
        arr.push({ codeAlias: '', codeName: i, codeType: 'STRING', isInput: true })
      }
      params.componentKeys = arr
    } else {
      params.componentKeys = dataCol
    }

    if (creatComponent?.id) {
      params.id = creatComponent?.id
      await editResource(params)
      message.success('添加成功')
    } else {
      await SpecialComponentInsert(params).catch()
      message.success('添加成功')
    }
    setCreatComponent(false)
    actionRef.current.reloadAndRest()
  }

  const selectType = (e) => {
    setComponentType(e.target.value)
  }

  const editParams = (row) => {
    formConfig.setFieldsValue(row)
    setParamConfig({ isedit: 'edit', data: row })
  }

  const onSortEnd = ({ oldIndex, newIndex }) => {
    if (oldIndex !== newIndex) {
      const removeItem = dataCol[oldIndex]
      dataCol.splice(oldIndex, 1)
      dataCol.splice(newIndex, 0, removeItem)
      setDataCol([...dataCol])
    }
  }

  const DraggableContainer = props => (
    <SortContainer
      useDragHandle
      disableAutoscroll
      helperClass="xd-row-dragging"
      onSortEnd={onSortEnd}
      {...props}
    />
  )

  const DraggableBodyRow = (props) => {
    const { className, style, ...restProps } = props
    const index = dataCol.findIndex(x => x.codeName === restProps['data-row-key'])
    return <SortableItem index={index} {...restProps} />
  }

  // 选择数组类型
  const selectArrayType = (e) => {
    setArrType(e.target.value)
  }

  // 参数配置
  const paramSure = async () => {
    formConfig.validateFields().then((res) => {
      if (paramConfig?.isedit === 'edit') {
        dataCol.forEach((item, index) => {
          if (item.codeName === paramConfig.data?.codeName) {
            dataCol[index] = res
          }
        })
        setDataCol([...dataCol])
      } else {
        setDataCol([...dataCol, res])
      }
      setParamConfig(false)
      formInstance.setFieldsValue('')
      formConfig.resetFields()
    })
      .catch((err) => {
        Promise.reject(err)
      })
    await parameterRef.current.reloadAndRest()
  }

  return (
    <div>
      <ProTable
        actionRef={actionRef}
        request={async () => {
          const result = await getAllSpecialTable()
          setTableData(result)
          return { data: result }
        }}
        scroll={{ x: 1500 }}
        rowKey="code"
        headerTitle="组件列表"
        columns={columns}
        toolBarRender={() => [
          <Button
            key="3" type="primary" onClick={async () => {
              formInstance.resetFields('')
              setCreatComponent(true)
              setDataCol([])
            }}
          >
            新建组件
          </Button>,
        ]}
        search={false}
      />
      <Modal
        visible={creatComponent}
        title="组件配置"
        onOk={componentSure}
        width={600}
        onCancel={async () => {
          setCreatComponent(false)
        }}
        footer={
          <>
            {
            componentType === 0 &&
              <div className={style.configCustom}>
                <p>自定义参数配置</p>
                <a onClick={() => setParamConfig(true)}>+添加参数</a>
              </div>
            }
            {componentType === 0 && <ProTable
              tableStyle={{ height: '200px', overflow: 'scroll' }}
              actionRef={parameterRef}
              rowKey="codeName"
              columns={configColumns}
              dataSource={dataCol}
              toolBarRender={false}
              search={false}
              components={{
                body: {
                  wrapper: DraggableContainer,
                  row: DraggableBodyRow,
                },
              }}
            />}
            <Button key="back" onClick={() => setCreatComponent(false)}>
              取消
            </Button>
            <Button key="submit" type="primary" onClick={componentSure}>
              确定
            </Button>
          </>
        }
      >
        <Form
          name="basic"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
          form={formInstance}
          autoComplete="off"
        >
          <Form.Item
            label="code"
            name="componentCode"
            rules={[{ message: '字段名称不能为空!' }, () => ({
              async validator (_, value) {
                if (!value) {
                  return Promise.reject(Error('请填写Code'))
                }

                for (const item of tableData) {
                  if (item.componentCode === value) {
                    return Promise.reject(Error('该code已存在'))
                  }
                }
              },
            })]}
          >
            <Input
              placeholder="请输入字段code"
            />
          </Form.Item>
          <Form.Item
            label="组件名称"
            name="componentName"
            rules={[{ message: '请输入组件名称' }, () => ({
              async validator (_, value) {
                if (!value) {
                  return Promise.reject(Error('请填写组件名称'))
                }

                for (const item of tableData) {
                  if (item.componentName === value) {
                    return Promise.reject(Error('该组件名称已存在'))
                  }
                }
              },
            })]}
          >
            <Input
              placeholder="请输入组件名称"
            />
          </Form.Item>

          <Form.Item
            label="组件类型"
            name="componentValueType"
            initialValue={0}
          >
            <Radio.Group options={options} onChange={selectType} />
          </Form.Item>
          {componentType === 1 &&
            <Form.Item label="数组类型" name="arrayType" initialValue={1}>
              <Radio.Group options={arrayOptions} onChange={selectArrayType} />
            </Form.Item>}
          {
            componentType === 1 && arrType === 1 &&
              <Form.Item
                label="数组长度"
                name="valueLength"
                rules={[
                  { required: true },
                  () => ({
                    async validator (_, value) {
                      if (value && value < 1) {
                        return Promise.reject(Error('请输入大于0的正整数'))
                      }
                    },
                  }),
                ]}
              >
                <Input
                  placeholder="请输入大于0的正整数"
                />
              </Form.Item>
          }
          <Form.Item label="默认参数配置" name="defaultConfig">
            <TextArea
              placeholder="请输入前后端约定的默认参数"
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        visible={paramConfig}
        title="参数配置"
        onOk={paramSure}
        onCancel={() => {
          setParamConfig(false)
          formConfig.resetFields()
        }}
        width={500}
      >
        <Form
          name="paramConfig"
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 16 }}
          form={formConfig}
          autoComplete="off"
        >
          <Form.Item
            label="字段名"
            name="codeName"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="字段别名"
            name="codeAlias"
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="字段类型"
            name="codeType"
            rules={[{ required: true }]}
          >
            <Select allowClear options={dslOptions} />
          </Form.Item>
          <Form.Item
            label="是否必填"
            name="isInput"
            rules={[{ required: true }]}
          >
            <Radio.Group options={isInputs} value="true" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        visible={concatSource}
        title="已关联资源"
        onCancel={() => {
          setConcatSource(false)
        }}
        width={700}
      >
        <Table columns={sourceColumn} dataSource={dataCom} />
      </Modal>
    </div>
  )
}
