import { useContext, useEffect, useState, useMemo, useRef } from 'react'
import { Form, Radio, Select, Switch, Input, Spin, InputNumber, Modal, Button, Dropdown, Menu } from 'antd'
import ProTable from '@ant-design/pro-table'
import useFetch from '@/hooks/useFetch'
import Context from '../../containers/bitools/createReport/Context'
import { DownOutlined } from '@ant-design/icons'
import { getSimpleReportList, getAllSpecialTable } from '@/services/reportService'
import style from './style.module.less'

const { Option } = Select

const helpTxt = `每一行就是一个筛选项, 例:
  五月
  六月
  如果筛选时需要传参2020-05-01，但又想在下拉框内显示成五月，可以写成
  2020-05=五月
  2020-06=六月`

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 18 },
}

const baseTypeMap = {
  INPUT: 'INPUT',
  SELECT: 'SELECT',
  SELECT_MULTI: 'SELECT',
  DATE: 'DATE',
  DATE_MONTH: 'DATE',
  NUMBER: 'NUMBER',
  NUMBER_RANGE: 'NUMBER',
  NUMBER_MIN: 'NUMBER',
  NUMBER_MAX: 'NUMBER',
  SPECIAL: 'SPECIAL',
}
const selectComMap = {
  SELECT: 0,
  SELECT_MULTI: 1,
}
const dateComMap = {
  DATE: 'day',
  DATE_MONTH: 'month',
}
const findTypeMap = {
  NUMBER_RANGE: 'RANGE',
  NUMBER_MIN: 'MIN',
  NUMBER_MAX: 'MAX',
}
const aggregateMap = {
  null: '无',
  sum: '求和',
  avg: '求平均值',
  max: '最大值',
  min: '最小值',
  count: '计数',
  // eslint-disable-next-line
  count_distinct: '去重计数',
}

const MoaOptions = [
  { label: '索引', value: 0 },
  { label: '单选', value: 1 },
  { label: '多选', value: 2 },
  { label: '覆盖', value: 3 },
]

function transformLovText (text) {
  if (!text) {
    return []
  }
  const lovValueList = []
  const list = text.split(/\s/)
  list.forEach((str) => {
    if (str.trim() === '') {
      return
    }
    const [value, title] = str.split('=')
    lovValueList.push({ value, title: title || value })
  })
  return lovValueList
}

/*
  可视化创建：
  aggrWithIndex: 与指标字段一致 true/false

    范围：
      compoentTtype: "NUMBER_RANGE"
      isRange:1
      valDefault: 数组内两个值

    最大最小：
      compoentTtype:"NUMBER_MAX" / "NUMBER_MIN"
      isRange:0
      valDefault: 单值

dsl创建：
  范围：
    compoentTtype:"NUMBER_RANGE"
    isRange:1
    valDefault: 数组内两个值

  最大最小：
    compoentTtype:"NUMBER_MAX" / "NUMBER_MIN"
    isRange:0
    valDefault: 单值
*/

export default function ParamForm (props) {
  const { data, indexItem, showAggregate } = props
  const { state } = useContext(Context)
  const [reportRes, fetchReportList] = useFetch(getSimpleReportList, { data: [] })
  const initType = ['INTEGER', 'DECIMAL', 'LONG', 'FLOAT', 'DOUBLE'].includes(data.dataType) ? 'NUMBER' : 'INPUT'
  const [baseType, setBaseType] = useState(baseTypeMap[data.componentType] || initType)
  const [selectComType, setSelectComType] = useState(selectComMap[data.componentType] || 0)
  const [dateComType, setDateComType] = useState(dateComMap[data.componentType] || 'day')
  const [componentType, setComponentType] = useState(data.componentType)

  const [isRange, setIsRange] = useState(data.isRange)
  const [isStaticLov, setIsStaticLov] = useState(data.isStaticLov)
  const [lovReportId, setLovReportId] = useState(data.lovReportId)

  const [showDefaultVal, setShowDefaultVal] = useState(!!data.valDefault)
  const [valDefault, setValDefault] = useState(data.valDefault)
  const [valDefMin, setValDefMin] = useState()
  const [valDefMax, setValDefMax] = useState()

  const [lovValueText, setLovValueText] = useState()
  const [lovValueList, setLovValueList] = useState(data.lovValueList)

  const [findType, setFindType] = useState(findTypeMap[data.componentType] || 'RANGE')
  const [form] = Form.useForm()
  const [formInstance] = Form.useForm()
  const actionRef = useRef()
  const [aggrWithIndex, setAggrWithIndex] = useState(data.aggrWithIndex)

  const [mechanism, setMechanism] = useState(data.mechanism || 0)
  const [customCode, setCustomCode] = useState(false)
  const [componentList, setComponentList] = useState([])
  const [contraColumns, setContraColumns] = useState(data.contraColumns || [])
  const [componentCode, setComponentCode] = useState(data.componentCode || [])
  const [filterCode, setFilterCode] = useState([])

  const customModal = useMemo(() => {
    console.log(state)
    const customSure = async () => {
      const params = await formInstance.validateFields()
      contraColumns.forEach((item) => {
        if (item.codeName === customCode.codeName) {
          item.relationCode = params.colAlias
        }
      })
      setComponentList([...contraColumns])
      setCustomCode(false)
    }

    return (
      <Modal
        visible={customCode}
        title="自定义字段"
        onOk={customSure}
        width={400}
        onCancel={() => {
          setCustomCode(false)
        }}
      >
        <Form
          form={formInstance}
        >
          <Form.Item
            label="字段名称"
            name="colAlias"
            rules={[{ message: '字段名称不能为空!' },
              () => ({
                async validator (_, value) {
                  if (!value) {
                    return Promise.reject(Error('请填名称!'))
                  }
                  for (const item in state.paramMap) {
                    if (state.paramMap[item].colAlias === value) {
                      return Promise.reject(Error('该名称已存在'))
                    }
                  }
                },
              })]}
          >
            {/* 判断字段是否重复 */}
            <Input placeholder="请输入字段名称" />
          </Form.Item>
        </Form>
      </Modal>
    )
  }, [customCode])

  useEffect(() => {
    const arr = state?.fieldList.map(item => ({
      label: item.colAlias,
      value: item.colName,
    }))
    setFilterCode(arr)
  }, [state?.fieldList])

  useEffect(() => {
    getAllSpecialTable().then((res) => {
      const list = res.map(item => ({
        label: item.componentName,
        value: item.componentCode,
        ...item,
      }))
      setComponentList(list)
    })
  }, [])

  useEffect(() => {
    let text = ''
    if (lovValueList) {
      lovValueList.forEach((item) => {
        const { title, value } = item
        text += `${value}=${title}\r\n`
      })
      setLovValueText(text)
    }
  }, [lovValueList])

  useEffect(() => {
    fetchReportList({ bizType: 4 })
  }, [])

  useEffect(() => {
    if (['DATE', 'NUMBER'].includes(baseType) && isRange) {
      const [min, max] = valDefault instanceof Array ? valDefault : []
      setValDefMin(min || min === 0 ? min : '')
      setValDefMax(max || max === 0 ? max : '')
    } else if (baseType === 'NUMBER') {
      if (findType === 'MIN') {
        setValDefMin(typeof valDefault === 'object' ? null : valDefault)
      } else if (findType === 'MAX') {
        setValDefMax(typeof valDefault === 'object' ? null : valDefault)
      }
    }
  }, [isRange, valDefault, baseType, findType])

  useEffect(() => {
    let componentType = 'INPUT'
    if (baseType === 'SELECT') {
      componentType = 'SELECT'
      if (selectComType === 1) {
        componentType = 'SELECT_MULTI'
      }
    } else if (baseType === 'DATE') {
      componentType = 'DATE'
      if (dateComType === 'month') {
        componentType = 'DATE_MONTH'
      }
    } else if (baseType === 'NUMBER') {
      componentType = `NUMBER_${findType}`
    } else if (baseType === 'SPECIAL') {
      componentType = 'SPECIAL'
    }
    setComponentType(componentType)
  }, [baseType, selectComType, dateComType, findType])

  useEffect(() => {
    let param = {
      componentType,
      isRange,
      isStaticLov,
      lovReportId,
      lovValueList,
      aggrWithIndex,
      showDefaultVal,
      mechanism,
      componentCode,
      contraColumns,
    }
    if (showDefaultVal) {
      let defaultValue = valDefault
      if ((componentType.includes('DATE') || componentType.includes('NUMBER')) && isRange) {
        defaultValue = [valDefMin, valDefMax]
      }
      if (componentType.includes('NUMBER')) {
        if (findType === 'MIN') {
          defaultValue = valDefMin
        } else if (findType === 'MAX') {
          defaultValue = valDefMax
        }
      }
      param = { ...param, valDefault: defaultValue }
    }
    props.onChange && props.onChange(param)
  }, [
    componentType, isRange, isStaticLov, lovReportId, lovValueList,
    showDefaultVal, valDefault, valDefMin, valDefMax, aggrWithIndex,
    findType, mechanism, componentCode, contraColumns,
  ])

  const columns = [
    {
      key: 'codeName',
      dataIndex: 'codeName',
      title: '参数',
    },
    {
      key: 'relationCode',
      dataIndex: 'relationCode',
      title: '关联字段',
      width: 250,
      render (record, row) {
        return (
          <Dropdown overlay={menu(row)}>
            <Button className={style.downButton}>
              <span style={{ width: '105px', overflow: 'hidden' }}>{contraColumns.find(item => item.relationCode === record)?.colName || ''}</span><DownOutlined style={{ right: '15px', bottom: '8px', position: 'absolute' }} />
            </Button>
          </Dropdown>
        )
      },
    },
  ]

  const paramList = useMemo(() => {
    const list = []
    Object.keys(state.paramMap).forEach((key) => {
      const item = state.paramMap[key]
      if (!item.checked) {
        list.push(item)
      }
    })
    return list
  }, [state.paramMap])

  const onAddKey = ({ key }, row) => {
    contraColumns.forEach((item) => {
      if (item.codeName === row.codeName) {
        item.relationCode = state.paramMap[key]?.colName
        item.colName = state.paramMap[key]?.colAlias
      }
    })
    setContraColumns([...contraColumns])
  }

  const menu = row => (
    <>
      <Menu onClick={i => onAddKey(i, row)} className={style.menu}>
        {paramList.filter((item) => {
          return item.colName &&
          item.colAlias
        }).map(({ colName, colAlias }) => (
          <Menu.Item key={colName} className={style.menuItem}>
            {colName === '#hierarchy#' ? <b>{colAlias}</b> : colAlias}
          </Menu.Item>
        ))}
      </Menu>
      <a
        className={style.addParams}
        onClick={() => {
          setCustomCode(row)
          formInstance.resetFields('')
        }}
      >新增自定义字段</a>
    </>
  )

  const onTextChange = () => {
    const text = transformLovText(lovValueText)
    setLovValueList(text)
  }

  const showRange = useMemo(() => {
    return ['INPUT', 'DATE', 'DATE_WEEK', 'DATE_MONTH'].includes(componentType)
  }, [componentType])

  const showDatasource = useMemo(() => {
    return ['SELECT', 'SELECT_MULTI'].includes(componentType)
  }, [componentType])

  useEffect(() => {
    if (showDefaultVal) {
      switch (findType) {
        case 'MIN':
          setValDefMax()
          break
        case 'MAX':
          setValDefMin()
          break
        default:
      }
    } else {
      setValDefMin()
      setValDefMax()
    }
    setIsRange(findType === 'RANGE' && baseType === 'NUMBER' ? 1 : 0)
  }, [findType, showDefaultVal, baseType])

  const changeMoa = (e) => {
    setMechanism(e.target.value)
  }

  const changeFilter = (e) => {
    console.log(e)
  }

  const changeComList = (key) => {
    const contractList = componentList.filter((item) => {
      return item.componentCode === key
    })
    setComponentCode(key)
    setContraColumns(contractList[0].componentKeys)
  }
  return (
    <Form form={form} {...formItemLayout}>
      <Form.Item label="展示组件类型">
        <Select
          value={baseType} onChange={(key) => {
            setBaseType(key)
            setValDefault()
          }}
        >
          <Option key="INPUT">文本</Option>
          <Option key="SELECT">下拉框</Option>
          <Option key="DATE">时间筛选</Option>
          <Option key="NUMBER">数值筛选器</Option>
          <Option key="SPECIAL">特殊组件</Option>
        </Select>
      </Form.Item>

      {baseType === 'SELECT'
        ? <Form.Item label="查询方式">
          <Radio.Group value={selectComType} onChange={e => setSelectComType(e.target.value)}>
            <Radio value={0}>单选</Radio>
            <Radio value={1}>多选</Radio>
          </Radio.Group>
        </Form.Item>
        : null}

      {baseType === 'DATE'
        ? <Form.Item label="时间粒度">
          <Radio.Group value={dateComType} onChange={e => setDateComType(e.target.value)}>
            <Radio value="day">日</Radio>
            <Radio value="month">月</Radio>
          </Radio.Group>
        </Form.Item>
        : null}

      {baseType === 'NUMBER' && showAggregate
        ? <Form.Item label="是否聚合">
          <Switch
            checkedChildren="开"
            unCheckedChildren="关"
            size="default"
            checked={aggrWithIndex}
            disabled={!indexItem}
            onChange={setAggrWithIndex}
          />&nbsp;&nbsp;
          {aggrWithIndex && indexItem ? `聚合方式：${aggregateMap[indexItem.aggregate]}` : null}
        </Form.Item>
        : null}

      {baseType === 'NUMBER'
        ? <Form.Item label="查询方式">
          <Radio.Group
            value={findType} onChange={(e) => {
              setFindType(e.target.value)
            }}
          >
            <Radio value="RANGE">范围</Radio>
            <Radio value="MIN">至少</Radio>
            <Radio value="MAX">至多</Radio>
          </Radio.Group>
        </Form.Item>
        : null}

      {baseType === 'NUMBER'
        ? <Form.Item label="设定默认值">
          <Switch
            checkedChildren="开"
            unCheckedChildren="关"
            size="default"
            checked={showDefaultVal}
            onChange={setShowDefaultVal}
          />
        </Form.Item>
        : null}

      {baseType === 'NUMBER'
        ? <Form.Item style={{ paddingLeft: '104px' }}>
          <InputNumber
            type="number"
            placeholder="最小值"
            style={{ border: ' 1px solid #d9d9d9', width: '100px' }}
            value={valDefMin}
            onChange={setValDefMin}
            disabled={!(showDefaultVal && ['RANGE', 'MIN'].includes(findType))}
          />&nbsp;
          ~
          &nbsp;<InputNumber
            type="number"
            placeholder="最大值"
            style={{ border: ' 1px solid #d9d9d9', width: '100px' }}
            value={valDefMax}
            disabled={!(showDefaultVal && ['RANGE', 'MAX'].includes(findType))}
            onChange={setValDefMax}
          />
        </Form.Item>
        : null}

      {showRange && baseType !== 'INPUT' && baseType !== 'NUMBER' && baseType !== 'SPECIAL'
        ? <Form.Item label="区间筛选">
          <Switch size="small" checked={isRange} onChange={() => setIsRange(!isRange)} />
        </Form.Item>
        : null}

      {showDatasource
        ? <Form.Item label="筛选值来源">
          <Radio.Group value={isStaticLov} onChange={e => setIsStaticLov(e.target.value)}>
            <Radio value={0}>数据集</Radio>
            <Radio value={1}>手工输入</Radio>
          </Radio.Group>
        </Form.Item>
        : null}

      {isStaticLov === 0 && ['SELECT', 'SELECT_MULTI'].includes(componentType)
        ? <Form.Item label="选择数据集">
          <Spin spinning={reportRes.loading}>
            <Select value={lovReportId} onChange={key => setLovReportId(key)}>
              {reportRes.data.map(({ id, title }) => <Option key={id}>{title}</Option>)}
            </Select>
          </Spin>
        </Form.Item>
        : null}

      {isStaticLov === 1 && ['SELECT', 'SELECT_MULTI'].includes(componentType)
        ? <Form.Item label="配置筛选值">
          <Input.TextArea
            rows={8}
            value={lovValueText}
            placeholder={helpTxt}
            onChange={e => setLovValueText(e.target.value)}
            onBlur={onTextChange}
          />
        </Form.Item>
        : null}
      {baseType !== 'NUMBER' && baseType !== 'SPECIAL'
        ? <Form.Item label="开启默认值">
          <Switch size="small" checked={showDefaultVal} onChange={() => setShowDefaultVal(!showDefaultVal)} />
          &nbsp;
          {showDefaultVal && baseType === 'DATE'
            // eslint-disable-next-line react/jsx-no-target-blank
            ? <a href="http://confluence.dian.so/pages/viewpage.action?pageId=15597665" target="_blank">查看配置规则</a>
            : null}
        </Form.Item>
        : null}

      {showDefaultVal && !isRange && baseType !== 'NUMBER'
        ? <Form.Item label="默认值">
          <Input value={valDefault} onChange={e => setValDefault(e.target.value)} />
        </Form.Item>
        : null}

      {showDefaultVal && isRange && baseType === 'DATE'
        ? <Form.Item label="默认值">
          <div className={style.range}>
            <Input className={style.rangeInput} value={valDefMin} onChange={e => setValDefMin(e.target.value)} />
            &nbsp;～&nbsp;
            <Input className={style.rangeInput} value={valDefMax} onChange={e => setValDefMax(e.target.value)} />
          </div>
        </Form.Item>
        : null}
      {
        baseType === 'SPECIAL' &&
          <Form.Item label="选择组件">
            <Select options={componentList} onChange={changeComList} value={componentCode} />
          </Form.Item>
      }
      {
        baseType === 'SPECIAL' &&
          <Form.Item label="组件作用机制">
            <Radio.Group options={MoaOptions} onChange={changeMoa} value={mechanism} />
          </Form.Item>
      }
      {
        baseType === 'SPECIAL' && mechanism !== 0 &&
          <Form.Item label="筛选">
            <Select options={filterCode} onChange={changeFilter} mode={mechanism === 2 ? 'multiple' : ''} />
          </Form.Item>
      }
      {
         baseType === 'SPECIAL' && mechanism === 0 &&
           <ProTable
             actionRef={actionRef}
             rowKey="code"
             columns={columns}
             dataSource={contraColumns}
             search={false}
             headerTitle={
               <>
                 <h4>映射关系配置</h4>
                 <span style={{
                   color: '#bfbfbf',
                   fontSize: '13px',
                   marginLeft: '14px',
                 }}
                 >关联字段不存在时，可以自定义字段</span>
               </>
              }
           />
      }
      {customModal}
    </Form>
  )
}
