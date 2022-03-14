import { useContext, useState, useEffect, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { SettingOutlined, TableOutlined, BarChartOutlined, LineChartOutlined } from '@ant-design/icons'
import { Button, Input, Switch, Space, Radio, Collapse, Checkbox, Tooltip, Form, Select } from 'antd'
import Target from '@/components/base/Target'
import useParseSearch from '@/hooks/useParseSearch'
import { getReportDownLoadLimit } from '@/services/reportService'
import AnchorDialog from './anchor-dialog'
import SortDialog from './SortDialog.jsx'
import ParamDialog from './param-dialog'
import Context from '../Context'
import formatTagName from '@/utils/format-tag-name'
import style from './style.module.less'

const mapType = {
  1: 'DATA_FILTER',
  2: 'CITY_FILTER',
}

export default function Panel (props) {
  const { state } = useContext(Context)
  const { mode } = useParseSearch(props)
  const [showSortConfig, setShowSort] = useState(false)
  const [showAnchor, setShowAnchor] = useState(false)
  const [downloadMaxLimit, setDownloadMaxLimit] = useState([{ label: '100000', value: 100000 }])
  const [showPanel, setShowPanel] = useState(mode === 'DSL' ? 'base' : 'chart')

  const fetchDownLoadData = async () => {
    const res = await getReportDownLoadLimit()
    const data = []
    if (Array.isArray(res)) {
      res.forEach((item) => {
        data.push({
          label: item,
          value: Number(item),
        })
      })
      setDownloadMaxLimit(data)
    }
  }

  useEffect(() => {
    if (state.defaultReportType === 'TABLE') {
      setShowPanel('base')
    } else {
      setShowPanel('chart')
    }
  }, [state.defaultReportType])

  useEffect(() => {
    fetchDownLoadData()
  }, [])

  return (
    <Space direction="vertical" className={style.panel}>
      <Collapse defaultActiveKey={['info', 'type', 'permit']}>
        <Collapse.Panel header="基础信息" key="info">
          <Info downloadMaxLimit={downloadMaxLimit} />
        </Collapse.Panel>

        <Collapse.Panel header="图表类型" key="type">
          <DataSetType />
        </Collapse.Panel>

        <Collapse.Panel header="缓存策略" key="cache">
          <CacheTime />
        </Collapse.Panel>

        <Collapse.Panel header="数据权限" key="permit">
          <DataCheck />
        </Collapse.Panel>

      </Collapse>
      {
        state.defaultReportType !== 'TABLE' && (
          <Radio.Group onChange={e => setShowPanel(e.target.value)} defaultValue="chart" value={showPanel}>
            <Radio.Button value="chart" style={{ width: '104px', textAlign: 'center' }}>图形属性</Radio.Button>
            <Radio.Button value="base" style={{ width: '104px', textAlign: 'center' }}>交互属性</Radio.Button>
          </Radio.Group>
        )
      }

      {
        showPanel === 'chart' && state.defaultReportType !== 'TABLE' && (
          <Collapse>
            <Collapse.Panel header="水平轴" key="xasis">
              <XAxisProps />
            </Collapse.Panel>
            <Collapse.Panel header="垂直轴" key="yaxis">
              <YAxisProps />
            </Collapse.Panel>
            <Collapse.Panel header="图表样式" key="style">
              <ChartStyleProps />
            </Collapse.Panel>
          </Collapse>
        )
      }
      {
        showPanel === 'base' && (
          <Collapse>
            <Collapse.Panel header="跳转设置" key="anchor" extra={<a><SettingOutlined className={style.icon} onClick={() => setShowAnchor(true)} /></a>}>
              {showAnchor
                ? <AnchorDialog onOk={() => setShowAnchor(false)} onCancel={() => setShowAnchor(false)} />
                : null}
            </Collapse.Panel>
            <Collapse.Panel header="排序设置" key="sort" extra={<a><SettingOutlined className={style.icon} onClick={() => setShowSort(true)} /></a>}>
              <Sort />
              {showSortConfig
                ? <SortDialog onOk={() => setShowSort(false)} onCancel={() => setShowSort(false)} />
                : null}
            </Collapse.Panel>
            <Collapse.Panel header="筛选项配置" key="selector">
              <Selector />
            </Collapse.Panel>
          </Collapse>
        )
      }
    </Space>
  )
}

function Info (props) {
  const { state, dispatch } = useContext(Context)
  const { downloadMaxLimit } = props
  return (
    <>
      <h3 className={style.titleIcon}>
        <span>标题</span>
      </h3>
      <Input
        value={state.title}
        onChange={e => dispatch({ type: 'setTitle', payload: { title: e.target.value } })}
      />
      <h3>
        <span>描述</span>
      </h3>
      <Input
        value={state.desc}
        onChange={e => dispatch({ type: 'setDesc', payload: { desc: e.target.value } })}
      />
      <h3>
        <span>code</span>
      </h3>
      <Input
        value={state.code}
        onChange={e => dispatch({ type: 'setCode', payload: { code: e.target.value } })}
      />
      <h3 className={style.titleIcon}>
        <span>下载条数</span>
      </h3>

      <Select
        className={style.downCountProperty}
        defaultValue={state.downloadMaxLimit}
        onChange={(value) => {
          dispatch({ type: 'setDownCount', payload: { downloadMaxLimit: value } })
        }}
      >
        {downloadMaxLimit.map(({ label, value }) => <Select.Option key={value} value={value}>{label}</Select.Option>)}
      </Select>
    </>
  )
}

function DataSetType (props) {
  const { mode } = useParseSearch(props)
  const { state, dispatch } = useContext(Context)
  const types = [
    { icon: <TableOutlined />, type: 'TABLE', desc: '' },
    { icon: <BarChartOutlined />, type: 'BAR', desc: '柱状图：维度个数=1且指标个数 >=1' },
    { icon: <LineChartOutlined />, type: 'LIN', desc: '折线图：维度个数=1且指标个数 >=1' },
  ]

  const disabled = !state.yAxis.length || state.xAxis.length !== 1
  return (
    <div>
      <Space>
        {
          types.map(e => (
            <Tooltip key={e.type} placement="bottom" title={e.desc}>
              <Button
                type={state.defaultReportType === e.type ? 'primary' : 'default'}
                icon={e.icon}
                disabled={mode === 'GRAPH' && e.type !== 'TABLE' && disabled}
                onClick={() => dispatch({ type: 'setReportType', payload: { defaultReportType: e.type } })}
              />
            </Tooltip>
          ))
        }
      </Space>
    </div>
  )
}

function CacheTime () {
  const { state, dispatch } = useContext(Context)
  const [form] = Form.useForm()

  useEffect(() => {
    form.setFieldsValue(state.cacheStrategy)
  }, [state.cacheStrategy])

  const onValuesChange = () => {
    const values = form.getFieldsValue(true)
    dispatch({
      type: 'setCacheStrategy',
      payload: { cacheStrategy: values },
    })
  }

  return (
    <div className={style.cacheForm}>
      <Form
        form={form}
        size="small"
        labelCol={{ span: 10 }}
        onValuesChange={onValuesChange}
        values={state.cacheStrategy}
      >
        <Form.Item labelCol={{ span: 10 }} label="是否开启" valuePropName="checked" name="switchOn">
          <Switch size="small" defaultChecked />
        </Form.Item>
        {
          state.cacheStrategy?.switchOn !== false
            ? <>
              <Form.Item label="时间" name="value" help="不能超过5分钟">
                <Input placeholder="默认123秒缓存" />
              </Form.Item>
              <Form.Item label="时间类型" name="timeUnit">
                <Select defaultValue="SECONDS">
                  <Select.Option value="SECONDS">秒</Select.Option>
                  <Select.Option value="MINUTES">分</Select.Option>
                </Select>
              </Form.Item>
            </>
            : null
        }
      </Form>
    </div>
  )
}

function XAxisProps () {
  const { state, dispatch } = useContext(Context)
  const plainOptions = [
    { label: '显示轴标题', value: 'showTitle' },
    { label: '显示轴标签', value: 'showTag' },
    { label: '显示坐标轴', value: 'showAxis' },
  ]
  const defaultValue = plainOptions.map(e => e.value).filter(e => state.props.xAxisProp[e])
  const onChange = (e) => {
    const values = { ...state.props.xAxisProp }
    plainOptions.map(e => e.value).forEach((key) => {
      values[key] = e.indexOf(key) > -1
    })
    dispatch({ type: 'setChartXAxisProps', payload: { xAxisProp: values } })
  }
  return (
    <>
      轴标题：<Input
        placeholder="输入轴标题"
        value={state.props.xAxisProp.title}
        onChange={e => dispatch({ type: 'setChartXAxisProps', payload: { xAxisProp: { ...state.props.xAxisProp, title: e.target.value } } })}
      />
      <Checkbox.Group
        options={plainOptions}
        value={defaultValue}
        onChange={onChange}
      />
    </>
  )
}

function YAxisProps () {
  const { state, dispatch } = useContext(Context)
  const plainOptions = [
    { label: '显示轴标题', value: 'showTitle' },
    { label: '显示轴标签', value: 'showTag' },
    { label: '显示坐标轴', value: 'showAxis' },
  ]
  const defaultValue = plainOptions.map(e => e.value).filter(e => state.props.yAxisPriProp[e])
  const onChange = (e) => {
    const values = { ...state.props.yAxisPriProp }
    plainOptions.map(e => e.value).forEach((key) => {
      values[key] = e.indexOf(key) > -1
    })
    dispatch({ type: 'setChartYAxisProps', payload: { yAxisPriProp: values } })
  }
  return (
    <>
      轴标题：<Input
        placeholder="输入轴标题"
        value={state.props.yAxisPriProp.title}
        onChange={e => dispatch({ type: 'setChartYAxisProps', payload: { yAxisPriProp: { ...state.props.yAxisPriProp, title: e.target.value } } })}
      />
      <Checkbox.Group
        options={plainOptions}
        value={defaultValue}
        onChange={onChange}
      />
    </>
  )
}

function ChartStyleProps () {
  const { state, dispatch } = useContext(Context)
  const plainOptions = [
    { label: '显示图表标签', value: 'showGraphTag' },
    { label: '显示网格线', value: 'showGridlines' },
    { label: '显示缩略图', value: 'showAbbreAxis' },
    { label: '显示图例', value: 'showMap' },
  ]
  const checkBoxOptions = [
    { label: '顶部', value: 'TOP' },
    { label: '下方', value: 'DOWN' },
  ]
  const onChange = (e) => {
    const values = { ...state.props.style }
    plainOptions.map(e => e.value).forEach((key) => {
      values[key] = e.indexOf(key) > -1
    })
    dispatch({ type: 'setChartStyleProps', payload: { style: values } })
  }
  const defaultValue = plainOptions.map(e => e.value).filter(e => state.props.style[e])
  return (
    <>
      <Checkbox.Group options={plainOptions} value={defaultValue} onChange={onChange} />
      图例位置：<Radio.Group
        options={checkBoxOptions}
        value={state.props.style.mapPosition}
        onChange={e => dispatch({ type: 'setChartStyleProps', payload: { style: { ...state.props.style, mapPosition: e.target.value } } })}
      />
    </>
  )
}

function DataCheck (props) {
  const { state, dispatch } = useContext(Context)
  const { mode } = useParseSearch(props)
  const [permission, setPermission] = useState(state.permission)
  const [nickName, setNickName] = useState(state.nickName)
  const [cityPermission, setCityPermission] = useState(state.cityPermission)
  const [unavailableReason, setUnavailableReason] = useState(state.unavailableReason)
  useEffect(() => {
    setPermission(state.permission)
    setCityPermission(state.cityPermission)
  }, [state.permission, state.cityPermission])

  useEffect(() => {
    dispatch({
      type: 'setPermission',
      payload: {
        permission, nickName,
      },
    })
  }, [permission, nickName])

  useEffect(() => {
    dispatch({
      type: 'setCityPermission',
      payload: {
        cityPermission, nickName,
      },
    })
  }, [cityPermission, nickName])

  useEffect(() => {
    setUnavailableReason(state.unavailableReason)
  }, [state.unavailableReason])

  return (
    <>
      开启数据权限验证 <Switch
        size="small" checked={!!permission} onChange={(v) => {
          if (mode === 'DSL') {
            setCityPermission(mapType[+v])
          }
          setPermission(2 * v)
        }}
      />
      {
        mode === 'DSL'
          ? <Radio.Group
              className={style.radioGroup}
              disabled={!permission}
              onChange={e => setCityPermission(e.target.value)}
              label="方式"
              value={cityPermission}
          >
            <Radio value="DATA_FILTER">组织架构鉴权</Radio>
            <Radio value="CITY_FILTER">地理城市鉴权</Radio>
          </Radio.Group>
          : ''
      }
      <div className={style.radioGroup} style={{ width: '190px' }}>
        <span>方式：</span>
        <Radio.Group
          className={style.radioGroup}
          disabled={!permission}
          onChange={e => setPermission(e.target.value)}
          value={permission}
        >
          <Radio value={1}>历史</Radio>
          <Radio value={2}>最新</Radio>
        </Radio.Group>
      </div>
      {
        unavailableReason[permission] &&
        (
          <div style={{ color: 'red' }}>{unavailableReason[permission]}</div>
        )
      }
      <Input disabled={!permission} placeholder="测试花名" onChange={e => setNickName(e.target.value)} />
    </>
  )
}

function Sort (props) {
  const { state } = useContext(Context)

  const list = useMemo(() => {
    const list = state.sortList.map((key) => {
      const [field] = key.split('&')
      const col = state.fieldList.find(e => e.colName === field)
      if (!col) return null
      const value = formatTagName(col)
      return <div key={value} className={style['sort-item']}>{value}</div>
    })
    return list
  }, [state.sortList, state.fieldList])

  return list
}

function Selector (props) {
  const { state, dispatch } = useContext(Context)
  const [showParamConfig, setShowParam] = useState(false)

  const onMove = ({ destination, source }) => {
    if (!destination) { return }

    let keyList = []
    Object.keys(state.paramMap).forEach((key) => {
      const item = state.paramMap[key]
      if (item.checked) { keyList.push(item) }
    })
    keyList.sort((a, b) => a.sequence - b.sequence)
    keyList = keyList.map(({ paramName }) => paramName)

    const key = keyList[source.index]
    keyList.splice(source.index, 1)
    keyList.splice(destination.index, 0, key)

    // 换了拖拽组件，但是model没改，所以排序的实现有些别扭
    dispatch({
      type: 'moveParams',
      payload: {
        keyList,
      },
    })
  }

  const children = useMemo(() => {
    let list = []

    Object.keys(state.paramMap).forEach((key) => {
      const item = state.paramMap[key]
      if (item.checked) { list.push(item) }
    })
    list.sort((a, b) => a.sequence - b.sequence)
    list = list.map((item, i) => {
      const { paramName, label } = item
      return (
        <Draggable key={paramName} draggableId={paramName} index={i}>
          {provided => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
            >
              <Target title={label} draggable />
            </div>
          )}
        </Draggable>
      )
    })
    return list
  }, [state.paramMap])

  return (
    <>
      <Button className={style.target} type="primary" onClick={() => setShowParam(true)}>
        添加筛选项
      </Button>
      <DragDropContext onDragEnd={onMove}>
        <Droppable droppableId="droppable-1" type="PERSON">
          {(provided) => {
            return (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {children}
                {provided.placeholder}
              </div>
            )
          }}
        </Droppable>
      </DragDropContext>
      {showParamConfig
        ? <ParamDialog onOk={() => setShowParam(false)} onCancel={() => setShowParam(false)} />
        : null}
    </>
  )
}
