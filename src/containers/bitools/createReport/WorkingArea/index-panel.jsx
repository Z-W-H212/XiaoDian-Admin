import { useContext, useMemo, useState, useEffect } from 'react'
import { useDrop } from 'react-dnd'
import { Input, Modal, Radio, Row, Col, Checkbox, Tooltip, Form } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'

import Target from '@/components/base/Target'
import DnDTargets from '../DnDTargets'
import Context from '../Context'
import reportTargetMap from '@/static/reportTargetMap'
import style from './style.module.less'

const numAggregKeys = ['sum', 'count', 'avg', 'count_distinct', 'max', 'min']
const NotNumAggregKeys = ['count', 'count_distinct']

export default function IndexWrap (props) {
  const { state, dispatch } = useContext(Context)

  const [activeKey, setActiveKey] = useState('')
  const [formInstance] = Form.useForm()

  const [, drop] = useDrop({
    accept: ['field'],
    drop (item) {
      dispatch({ type: 'copyIndex', payload: item })
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
    }),
  })

  const data = useMemo(() => {
    const list = Object.keys(state.indexMap).map((key) => {
      const { colName, colAlias, colType, sequence, isNumber, aggregate, ifCalSamePeriodCompare } = state.indexMap[key]
      const title = `${colAlias}${state.mode ? '' : `「${reportTargetMap[aggregate]}」`}`
      return { key: colName, title, type: colType, sequence, isNumber, ifCalSamePeriodCompare }
    })

    list.sort((a, b) => a.sequence - b.sequence)

    return list
  }, [state.indexMap])

  useEffect(() => {
    if (activeKey) {
      formInstance.resetFields()
      formInstance.setFieldsValue(state.indexMap[activeKey])
    }
  }, [activeKey, state.indexMap])

  const onMove = (data) => {
    dispatch({
      type: 'moveIndex',
      payload: {
        data,
      },
    })
  }

  const onChange = (key, value, type = 'changeIndexAggregate') => {
    if (value === 'numberFormat') {
      return setActiveKey(key)
    }
    dispatch({
      type,
      payload: {
        colName: key,
        value,
      },
    })
  }

  const onClose = (colName) => {
    dispatch({
      type: 'closeIndex',
      payload: { colName },
    })
  }

  const onCancel = () => {
    setActiveKey('')
  }
  const onSubmit = () => {
    formInstance.validateFields().then((values) => {
      dispatch({
        type: 'changeIndexNumberFormat',
        payload: {
          colName: activeKey,
          ...values,
        },
      })
      setActiveKey('')
    })
  }

  return (
    <>
      <div ref={drop} className={style.dropWrap}>
        <DnDTargets
          title="指标"
          targetType="targetIndex"
          data={data}
          onMove={onMove}
          renderTarget={(item, isDragging) => {
            const { key, title, isNumber, numberFormat } = item
            const menuData = isNumber ? numAggregKeys : NotNumAggregKeys
            return (
              <Target
                showNumberFormat
                numberFormat={numberFormat}
                isDragging={isDragging}
                targetKey={key}
                title={title}
                menuData={state.mode ? null : menuData}
                onChange={onChange}
                onClose={onClose}
              />
            )
          }}
        />
      </div>
      <Modal
        title="数值格式"
        visible={!!activeKey}
        width={600}
        onCancel={onCancel}
        onOk={onSubmit}
      >
        <Form form={formInstance} name="target-index-number-form">
          <Row>
            <Col span={18}>
              <Form.Item
                name="decimal"
                label="小数位数"
                validateTrigger="onBlur"
                rules={[{
                  validator (_, value) {
                    if (!value || /^(|0|[1-9][0-9]*)$/.test(value)) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error(''))
                  },
                  message: '仅支持自然数，即>=0的整数',
                }]}
              >
                <Input
                  suffix={
                    <Tooltip title="保留几位小数，输入自然数（大于等于0的整数）">
                      <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
                    </Tooltip>
                  }
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                valuePropName="checked"
                name="round"
                labelCol={{ span: 8 }}
                initialValue={false}
              >
                <Checkbox className="Checkbox">四舍五入</Checkbox>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="千位分隔符"
            name="separator"
            initialValue={false}
          >
            <Radio.Group>
              <Radio value={false}>关闭</Radio>
              <Radio value>开启</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
