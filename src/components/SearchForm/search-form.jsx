/* eslint-disable eqeqeq */
import { useMemo, useState, useEffect } from 'react'
import moment from 'moment'
import '@ant-design/compatible/assets/index.css'
import { Button, Input, DatePicker, Select, InputNumber, Form, Switch } from 'antd'
import Organization from '@/components/organization/index'
import filterParams from '@/utils/filterParams'
import { transformValue, specialValueToMap } from './utils'
import style from './style.module.less'

const { MonthPicker, RangePicker } = DatePicker
const { Option } = Select

const specialFilterMap = {
  organization: Organization,
}

const InputRange = (props) => {
  const { value, disabled, placeholder } = props
  const values = value instanceof Array ? value : []
  const disableds = disabled instanceof Array ? disabled : []
  const placeholders = placeholder instanceof Array ? placeholder : []

  const [value1, setValue1] = useState(values[0] === undefined ? null : values[0])
  const [value2, setValue2] = useState(values[1] === undefined ? null : values[1])

  useEffect(() => {
    const values = value instanceof Array ? value : [null, null]
    setValue1(values[0] === undefined ? null : values[0])
    setValue2(values[1] === undefined ? null : values[1])
    props.onChange && props.onChange(values)
  }, [value])

  useEffect(() => {
    props.onChange && props.onChange([value1, value2])
  }, [value1, value2])

  return (
    <div className={style['range-search']}>
      <InputNumber value={value1} onChange={setValue1} placeholder={placeholders[0]} disabled={disableds[0]} />
      <InputNumber value={value2} onChange={setValue2} placeholder={placeholders[1]} disabled={disableds[1]} />
    </div>
  )
}

function RangMonth (props) {
  const { value, placeholder } = props

  const onPanelChange = (value) => {
    const [start, end] = value
    const st = moment(start.format('YYYYMM01'))
    const et = moment(end.add(1, 'months').format('YYYYMM01')).subtract(1, 'days')
    props.onChange && props.onChange([st, et])
  }

  return (
    <RangePicker
      value={value}
      picker="month"
      placeholder={placeholder}
      onChange={onPanelChange}
    />
  )
}

function CreateFilterComponent (data) {
  const { componentType, componentCode, isRange, lovValueList, valDefault, queryValue } = data
  let placeholder = queryValue == undefined ? valDefault : queryValue

  if (componentType.includes('DATE')) {
    if (placeholder instanceof Array) {
      const [start, end] = placeholder
      placeholder = [moment(start).format('YYYY-MM-DD'), moment(end).format('YYYY-MM-DD')]
    } else {
      placeholder = placeholder && moment(placeholder).format('YYYY-MM-DD')
    }
  }

  if (['SELECT', 'SELECT_MULTI'].includes(componentType)) {
    const props = { className: 'select-size-m' }
    componentType === 'SELECT_MULTI' && (props.mode = 'multiple')
    return (
      <Select {...props} allowClear showArrow showSearch placeholder={placeholder || `请选择${data.label}`}>
        {lovValueList.map(({ value, title }, i) => <Option key={value}>{title}</Option>)}
      </Select>
    )
  } else if (componentType === 'DATE') {
    if (isRange) {
      return <RangePicker placeholder={placeholder} />
    }
    return <DatePicker placeholder={placeholder} />
  } else if (componentType === 'DATE_MONTH') {
    if (isRange) {
      return <RangMonth placeholder={placeholder} />
    }
    return <MonthPicker placeholder={moment(placeholder).format('YYYY-MM')} />
  } else if (componentType.includes('NUMBER')) {
    let placeholders = ['最小值', '最大值']
    if (queryValue !== undefined) {
      // 统一处理queryValue参数
      const queryVal = Array.isArray(queryValue) ? queryValue : [queryValue, queryValue]
      placeholders = isRange
        ? queryVal
        : [componentType === 'NUMBER_MIN' ? queryVal[0] : '最小值', componentType === 'NUMBER_MAX' ? queryVal[1] : '最大值']
    } else if (valDefault) {
      placeholders = isRange
        ? valDefault
        : [componentType === 'NUMBER_MIN' ? valDefault : '最小值', componentType === 'NUMBER_MAX' ? valDefault : '最大值']
    }
    return (
      <InputRange
        disabled={[componentType === 'NUMBER_MAX', componentType === 'NUMBER_MIN']}
        placeholder={placeholders}
      />
    )
  } else if (componentType === 'SPECIAL') {
    const Component = specialFilterMap[componentCode]
    if (Component) {
      return <Component config={data} />
    }
  }
  return <Input placeholder={placeholder} />
}

function SearchFrom (props) {
  const [showHidden, setShowHidden] = useState(false)

  const { data, showSearch } = props
  const [formInstance] = Form.useForm()

  const styleOpt = useMemo(() => {
    const style = {}
    if (showSearch === false) {
      style.height = 0
      style.padding = 0
    }
    return style
  }, [showSearch])

  const onSubmit = () => {
    const values = formInstance.getFieldsValue(true)
    const map = {}
    Object.keys(values).forEach((key) => {
      const { componentType, mechanism, contraColumns } = data.find(item => item.paramName === key)
      const theValue = transformValue(values[key], componentType)
      if (componentType === 'SPECIAL') {
        const specialValueMap = specialValueToMap(theValue, mechanism, contraColumns)
        Object.keys(specialValueMap)
          .forEach(key => (map[key] = specialValueMap[key]))
      } else {
        map[key] = theValue
      }
    })
    props.onSubmit && props.onSubmit(filterParams(map))
  }

  const onReset = () => {
    formInstance.resetFields()
    props.onReset && props.onReset()
  }

  // useMemo 会导致组件无法正确更新value
  const inputList = !data
    ? []
    : data.filter(item => showHidden || item.visible).map((item) => {
      const { paramName, label } = item
      return (
        <Form.Item
          key={paramName}
          label={label}
          name={paramName}
          className={`${item.visible || style.hidden} ${style.antFormItem}`}
        >
          {CreateFilterComponent(item)}
        </Form.Item>
      )
    })

  const buttons = useMemo(() => {
    if (!data || data.length === 0) {
      return null
    }
    return (
      <Form.Item>
        <Button type="primary" onClick={onSubmit}>搜索</Button>
        <Button className={style.reset} onClick={onReset}>重置</Button>
        <span style={{ margin: '0 12px' }}>展开隐藏条件</span>
        <Switch onChange={setShowHidden} />
      </Form.Item>
    )
  }, [inputList])

  return (
    <div className={style.search} style={styleOpt}>
      <Form
        layout="inline"
        form={formInstance}
      >
        {inputList}
        {buttons}
      </Form>
    </div>
  )
}

export default SearchFrom
