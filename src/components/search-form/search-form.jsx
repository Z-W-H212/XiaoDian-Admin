import { useEffect } from 'react'
import moment from 'moment'
import { Form } from '@ant-design/compatible'
import '@ant-design/compatible/assets/index.css'
import { DatePicker, Select, Input, Button } from 'antd'

import style from './style.module.less'

function Search (props) {
  const { data } = props
  const { getFieldDecorator } = props.form

  useEffect(() => {
    const map = {}
    data.forEach((item) => {
      const { key, defaultValue } = item
      map[key] = defaultValue
    })
    props.form.setFieldsValue(map)
  }, [data])

  const onReset = () => {
    props.form.resetFields()
  }

  const onSubmit = (event) => {
    event.preventDefault()
    props.form.validateFields((err, values) => {
      if (err) return
      const params = {}
      data.forEach((item) => {
        const { key, type } = item
        if (values[key] === undefined) {
          return false
        }
        params[key] = type === 'DATE' ? moment(values[key]).format('YYYYMMDD') : values[key]
        if (type === 'DATE' && values[key]) {
          params[key] = moment(values[key]).format('YYYYMMDD')
        } else {
          params[key] = values[key]
        }
      })
      props.onSearch && props.onSearch(params)
    })
  }

  return (
    <Form layout="inline" onSubmit={onSubmit}>
      {data.map((item) => {
        const { key, title, type, list } = item

        if (type === 'TEXT') {
          return (
            <Form.Item key={key} label={title}>
              {getFieldDecorator(key)(<Input />)}
            </Form.Item>
          )
        } else if (type === 'RADIO') {
          return (
            <Form.Item key={key} label={title}>
              {getFieldDecorator(key, {})(<Select className="select-size-l">
                {list.map(({ title, value }) => <Select.Option key={value}>{title}</Select.Option>)}
              </Select>)}
            </Form.Item>
          )
        } else if (type === 'MULTIPLE') {
          return (
            <Form.Item key={key} label={title}>
              {getFieldDecorator(key, {})(<Select className="select-size-l" mode="multiple">
                {list.map(({ title, value }) => <Select.Option key={value}>{title}</Select.Option>)}
              </Select>)}
            </Form.Item>
          )
        } else if (type === 'DATE') {
          return (
            <Form.Item key={key} label={title}>
              {getFieldDecorator(key, {})(<DatePicker inputReadOnly />)}
            </Form.Item>
          )
        }

        return null
      })}
      <Form.Item>
        <Button onClick={onReset}>清空</Button>
        <Button className={style.search} type="primary" htmlType="submit">搜索</Button>
      </Form.Item>
    </Form>
  )
}

const WrapSearchForm = Form.create({ name: 'search' })(Search)

export default WrapSearchForm
