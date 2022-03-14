/* 指标 */
import { useState, useRef, useContext, useEffect, useMemo } from 'react'
import { ReactSortable } from 'react-sortablejs'
import { Input, Modal, Radio, Row, Col, Checkbox, Tooltip, Form } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import reportTargetMap from '@/static/reportTargetMap'
import Context from '../../Context'
import ReactSortableContext from '../Context'
import Item from './item'
import formatTagName from '@/utils/format-tag-name'
import style from '../style.module.less'

const numAggregKeys = ['sum', 'count', 'avg', 'count_distinct', 'max', 'min']
const NotNumAggregKeys = ['count', 'count_distinct']

export default function Indicator (): JSX.Element {
  const { state, dispatch } = useContext(Context)
  const { state: reactSortableState, dispatch: reactSortableDispatch } = useContext(ReactSortableContext)
  const [activeKey, setActiveKey] = useState('')
  const [formInstance] = Form.useForm()
  const instance = useRef()

  useEffect(() => {
    reactSortableDispatch({
      type: 'initInstance',
      payload: {
        field: 'indicatorInstance',
        instance,
      },
    })
  }, [instance])

  const data: any[] = useMemo(() => {
    const list = Object.keys(state.indexMap).map((key) => {
      const {
        colName, colAlias, tagAlias, tagTimePeriod, tagRemark, colType,
        sequence, isNumber, aggregate, ifCalSamePeriodCompare,
      } = state.indexMap[key]
      const title = `${formatTagName({ colName, colAlias, tagAlias, tagTimePeriod, tagRemark })}${state.mode ? '' : `「${reportTargetMap[aggregate]}」`}`
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
      <div
        className={style.container}
        id="indicator-container"
        style={{ opacity: reactSortableState.indicatorInstance?.current?.sortable.option('disabled') ? 0.3 : 1 }}
      >
        <label className={style.label}>指标</label>
        <ReactSortable
          ref={instance}
          tag="ul"
          list={data}
          setList={(dataTransfer) => {
            dispatch({ type: 'updateIndexMap', payload: dataTransfer })
          }}
          ghostClass={style.ghost} // 拖动时候影子元素添加的样式类
          animation={150} // 动画时长
          group={{
            name: 'indicator',
            put: ['field-list', 'dimension'],
          }}
      // style={{opacity: targetDisabled ? 0.5 : 1}}
        >
          {data.map((item) => {
            const { key, title, isNumber, numberFormat } = item
            const menuData = isNumber ? numAggregKeys : NotNumAggregKeys
            return (
              <Item
                key={key}
                showNumberFormat
                numberFormat={numberFormat}
                targetKey={key}
                title={title}
                menuData={state.mode ? null : menuData}
                onChange={onChange}
                onClose={onClose}
              />
            )
          })}
        </ReactSortable>
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
