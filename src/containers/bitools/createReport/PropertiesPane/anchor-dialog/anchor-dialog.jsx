import { useEffect, useContext, useState, useMemo } from 'react'
import { FormOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  Form,
  Modal,
  Button,
  Radio,
  Select,
  Table,
  Menu,
  message,
  Input,
  Popconfirm,
  Tooltip,
} from 'antd'
import '@ant-design/compatible/assets/index.css'

import Paragraph from '@/components/layout/Paragraph'
import Context from '../../Context'
import useFetch from '@/hooks/useFetch'
import { getSimpleReportList, getReportConfig } from '@/services/reportService'
import { getDashboardList, getDashboardConfig } from '@/services/dashboardService'
import formatTagName from '@/utils/format-tag-name'
import style from './style.module.less'

const { Block, Content } = Paragraph
const { Option } = Select
const { TextArea } = Input

export default function AnchorDialog (props) {
  const { state, dispatch } = useContext(Context)
  const { dimensionMap, indexMap, drillMap, organization } = state

  const [reportRes, fetReportList] = useFetch(getSimpleReportList, { data: [] })
  const [dashboardRes, fetDashboardList] = useFetch(getDashboardList, { data: [] })
  const [anchorList, setAnchor] = useState(state.anchorList)
  const [selectedIndex, setSelected] = useState(-1)
  const [targetParams, setTargetParams] = useState([])
  const [targetParamsError, setTargetParamsError] = useState(null)
  const [linkParams, setLinkParams] = useState({
    show: false,
    options: {},
    activeItem: {},
  })

  const [linkParamsFormInstance] = Form.useForm()
  const [anchorFormInstance] = Form.useForm()

  const drillList = useMemo(() => {
    const list = []
    Object.keys(drillMap).forEach((key) => {
      if (key === '#organization#') {
        organization.forEach((item) => {
          list.push(item.colName)
        })
      } else {
        list.push(key)
      }
    })
    return list
  }, [drillMap, organization])

  useEffect(() => {
    fetReportList()
    fetDashboardList()
  }, [])

  const anchorItem = anchorList[selectedIndex] || {}
  useEffect(() => {
    const { resourceId, resourceType } = anchorItem

    const fetch = async () => {
      let paramList = []
      try {
        if (resourceType === 'report') {
          const data = await getReportConfig({ id: resourceId })
          paramList = data.paramList
        } else if (resourceType === 'dashboard') {
          const data = await getDashboardConfig(resourceId)
          paramList = data.paramList
        }
        setTargetParams(paramList)
        setTargetParamsError(null)
      } catch (error) {
        setTargetParamsError(error)
      }
    }

    if (resourceId && resourceType) {
      fetch()
    }
  }, [anchorItem.resourceId])

  const onOk = () => {
    // ???????????????????????? ????????????
    const anchorFromParamMap = {}

    for (let i = 0, len = anchorList.length; i < len; i++) {
      const item = anchorList[i]
      if (anchorFromParamMap[item.fromParam]) {
        anchorFromParamMap[item.fromParam].push(item.targetName)
      } else {
        anchorFromParamMap[item.fromParam] = [item.targetName]
      }
    }

    for (let i = 0, len = anchorList.length; i < len; i++) {
      const item = anchorList[i]
      if (!item.fromParam) return message.error('?????????????????????')

      if (!item.targetName && anchorFromParamMap[item.fromParam].length > 1) {
        handleSetFieldsValue(i, true)
        return message.error('?????????????????????')
      }

      // ?????????????????????????????????
      const _list = anchorFromParamMap[item.fromParam].filter(val => val === item.targetName)
      if (_list.length > 1) {
        handleSetFieldsValue(i, true)
        return message.error('???????????????')
      }

      // ??????url???????????????????????????
      if (!item.targetURL && !item.resourceId) {
        handleSetFieldsValue(i, true)
        return message.error('?????????????????????')
      }
    }

    handleSubmit(props)
  }

  const handleSubmit = (props) => {
    const fieldListCopy = [...state.fieldList]
    const keys = []
    anchorList.forEach(({ fromParam }) => keys.push(fromParam))

    if (keys.length) {
      state.fieldList.forEach((e, i) => {
        if (keys.indexOf(e.colName) >= 0) {
          fieldListCopy[i]._source = 'conflict'
        }
      })
      dispatch({ type: 'setFieldList', payload: { fieldList: fieldListCopy } })
    }

    dispatch({
      type: 'setAnchor',
      payload: { anchorList },
    })

    props.onOk && props.onOk(anchorList)
  }

  const onAdd = () => {
    const list = anchorList.slice()
    list.push({
      fromParam: '',
      isEdit: true,
      resourceType: 'report',
      openMode: 'SELF',
      layer: 'ALL_LAYER',
      targetName: '',
      customParam: '',
      paramMap: null,
      resourceId: null,
      targetURL: '',
    })
    setAnchor(list)
  }

  const handleSetFieldsValue = (index, isValidate) => {
    // ?????? targetURL ?????? ??????????????????????????????
    const showTarget = !!anchorList[index].targetURL
    anchorList[index].showTarget = showTarget
    // ?????? anchorForm ????????????
    anchorFormInstance.resetFields()
    anchorFormInstance.setFieldsValue({
      ...anchorList[index],
    })
    // ??????????????????????????????  ??????????????????????????????????????????
    if (isValidate) {
      // ??????????????????
      anchorFormInstance.validateFields(['targetName', 'resourceId'])
    }
    setAnchor([...anchorList])
    setSelected(index)
  }

  const onDel = (index) => {
    anchorList.splice(index, 1)
    const len = anchorList.length
    const _index = index <= len - 1 ? index : len ? len - 1 : null
    if (anchorList[_index]) {
      handleSetFieldsValue(_index, anchorList[_index].fromParam)
    } else {
      setAnchor([...anchorList])
      setSelected(null)
    }
  }

  const onEdit = (index) => {
    anchorList[index].isEdit = true
    setAnchor([...anchorList])
  }

  const onSelectMenu = (value, index) => {
    const _fromParams = anchorList[index].fromParam
    anchorList[index].fromParam = value
    anchorList[index].isEdit = false
    handleSetFieldsValue(index, _fromParams)
  }

  const onSelect = (index) => {
    handleSetFieldsValue(index, anchorList[index].fromParam)
  }

  const onChange = (values) => {
    const anchorItem = anchorList[selectedIndex]
    // ??????????????????
    if (values.showTarget !== undefined) {
      // ??? -> ??? ?????? ????????????
      if (values.showTarget) {
        anchorItem.resourceId = null
      } else {
        // ??? -> ??? ??????targetURL
        anchorItem.targetURL = ''
      }
    }
    // ????????????????????????
    if (values.resourceType) {
      anchorItem.resourceId = null
      // ??????????????? ???????????????????????? ???????????????????????????
      if (values.resourceType === 'dashboard' && anchorItem.openMode === 'MODAL') {
        anchorItem.openMode = 'SELF'
      }
    }
    Object.keys(values).forEach(key => (anchorItem[key] = values[key]))
    setAnchor([...anchorList])
    anchorFormInstance.setFieldsValue(anchorItem)
  }

  const onLinkField = (fieldRow) => {
    if (!anchorList[selectedIndex]) return
    const anchorItem = anchorList[selectedIndex]
    const { resourceId, targetURL } = anchorItem

    const theResourceParams = []

    const pushParam = (key, map) => {
      if (key === '#organization#') {
        organization.forEach((item) => {
          const { colName, colAlias, realColName, realColAlias } = item
          theResourceParams.push({ title: realColAlias || realColName, value: realColName })
          theResourceParams.push({ title: colAlias || colName, value: colName })
        })
      } else {
        const { colName, colAlias } = map[key]
        theResourceParams.push({ title: colAlias || colName, value: colName })
      }
    }

    Object.keys(dimensionMap).forEach(key => pushParam(key, dimensionMap))
    Object.keys(indexMap).forEach(key => pushParam(key, indexMap))

    for (const col of state.fieldList) {
      if (indexMap[col.colName] || dimensionMap[col.colName]) {
        continue
      }
      pushParam(col.colName, { [col.colName]: col })
    }

    const activeItem = {
      fieldKey: '',
      targetFieldKey: '',
      targetField: '',
      customParam: '',
      ...fieldRow,
      configWay: fieldRow && fieldRow.customParam ? 'custom' : 'standard',
      isEdit: !!fieldRow,
    }
    linkParamsFormInstance.setFieldsValue(activeItem)
    if (targetURL) {
      setLinkParams({
        show: true,
        options: {
          theResourceParams,
          showTarget: true,
        },
        activeItem,
      })
    } else {
      if (!resourceId) {
        return message.error('??????????????????')
      }

      const targetColList = []
      targetParams.forEach(({ paramName, label }) => {
        if (paramName === '#hierarchy#') { return }

        targetColList.push({ value: paramName, title: label })
      })

      if (targetColList.length === 0) {
        return message.error('????????????????????????????????????????????????')
      }

      setLinkParams({
        show: true,
        options: {
          theResourceParams,
          targetColList,
        },
        activeItem,
      })
    }
  }

  const onLinkParamsCancel = () => {
    linkParamsFormInstance.resetFields()
    linkParams.show = false
    setLinkParams({ ...linkParams })
  }

  const onLinkParamsOk = () => {
    linkParamsFormInstance.validateFields().then((values) => {
      if (values.configWay === 'custom') {
        anchorItem.customParam = values.customParam
      } else {
        if (!anchorItem.paramMap) {
          anchorItem.paramMap = {}
        }
        // ????????????????????? ??????????????????  ????????????????????????
        if (linkParams.activeItem.isEdit && !linkParams.activeItem.customParam) {
          delete anchorItem.paramMap[linkParams.activeItem.fieldKey]
        }
        anchorItem.paramMap[values.fieldKey] =
            anchorItem.showTarget ? values.targetField : values.targetFieldKey
      }
      onLinkParamsCancel()
      setAnchor([...anchorList])
    })
  }

  const onDelField = (field) => {
    const anchorItem = anchorList[selectedIndex]

    if (field) {
      const paramMap = {}
      Object.keys(anchorItem.paramMap || {}).forEach((key) => {
        if (key === field) return
        paramMap[key] = anchorItem.paramMap[key]
      })
      anchorItem.paramMap = paramMap
    } else {
      anchorItem.customParam = ''
    }

    setAnchor(anchorList.slice())
  }

  const resourceList = useMemo(() => {
    if (!anchorList[selectedIndex]) return []
    const map = {
      report: reportRes.data,
      dashboard: dashboardRes.data,
    }
    const { resourceType } = anchorList[selectedIndex]
    return map[resourceType] || []
  }, [reportRes.data, dashboardRes.data, anchorList, selectedIndex])

  const columns = useMemo(() => {
    return [
      {
        key: 'field',
        dataIndex: 'field',
        title: '????????????',
      },
      {
        key: 'targetField',
        dataIndex: 'targetField',
        title: '????????????????????????',
        width: 200,
        ellipsis: true,
        render (value, row) {
          return <Tooltip placement="bottomLeft" title={value}>{value}</Tooltip>
        },
      },
      {
        key: 'other',
        dataIndex: 'other',
        title: '??????',
        render (value, row) {
          return (
            <>
              <a style={{ marginRight: 16 }} onClick={() => onLinkField(row)}>??????</a>
              <Popconfirm
                title="????????????????"
                onConfirm={() => onDelField(row.fieldKey)}
              >
                <a>??????</a>
              </Popconfirm>
            </>
          )
        },
      },
    ]
  }, [anchorList, selectedIndex, targetParams])

  const dataSource = useMemo(() => {
    if (!anchorList[selectedIndex]) return []
    const item = anchorList[selectedIndex]
    const paramMap = item.paramMap || {}
    const list = Object.keys(paramMap).map((key) => {
      const targetFieldKey = item.paramMap[key]
      const param = targetParams.find((item) => {
        return item.paramName === targetFieldKey
      })

      return {
        field: state.paramMap[key] ? state.paramMap[key].colAlias : key,
        fieldKey: key,
        targetField: param ? param.label : targetFieldKey,
        targetFieldKey,
      }
    })
    if (item.customParam) {
      list.push({
        field: '',
        targetField: item.customParam,
        customParam: item.customParam,
      })
    }
    return list
  }, [anchorList, selectedIndex, targetParams])

  const panel = useMemo(() => {
    if (!anchorList[selectedIndex]) return null
    return (
      <div>
        <AnchorForm
          form={anchorFormInstance}
          resourceList={resourceList}
          drillList={drillList}
          data={anchorList[selectedIndex] || {}}
          anchorList={anchorList}
          selectedIndex={selectedIndex}
          onChange={onChange}
        />
        <div style={{ width: 632 }}>
          <Table columns={columns} dataSource={dataSource} pagination={false} />
          <Button className={style.buttonAdd} disabled={!!targetParamsError} onClick={() => onLinkField()}>
            <i className="iconfont iconplus" />
            ??????????????????
          </Button>
        </div>
      </div>
    )
  }, [selectedIndex, anchorList, drillList, columns, dataSource, targetParams, resourceList, targetParamsError])

  const linkParamsMemo = useMemo(() => {
    return (
      <Modal
        visible={linkParams.show}
        title="????????????"
        onOk={onLinkParamsOk}
        onCancel={onLinkParamsCancel}
      >
        <LinkParamsForm
          form={linkParamsFormInstance}
          options={linkParams.options}
          activeItem={linkParams.activeItem}
          paramMap={anchorItem.paramMap}
        />
      </Modal>
    )
  }, [linkParams])

  return (
    <Modal
      className={style.anchorDialog}
      title="????????????"
      visible
      onOk={onOk}
      onCancel={props.onCancel}
    >
      <Paragraph>
        <Block className={style.ancorSider}>
          <Sider
            selectedIndex={selectedIndex}
            drillList={drillList}
            anchorList={anchorList}
            onSelect={onSelect}
            onAdd={onAdd}
            onDel={onDel}
            onEdit={onEdit}
            onSelectMenu={onSelectMenu}
          />
        </Block>
        <Content>
          {panel}
        </Content>
      </Paragraph>
      {linkParamsMemo}
    </Modal>
  )
}

function Sider (props) {
  const { anchorList, drillList, selectedIndex } = props
  const { state } = useContext(Context)
  const { dimensionMap, indexMap, fieldList, paramMap } = state
  const [selectedKey, setSelectedKey] = useState(selectedIndex)

  useEffect(() => {
    setSelectedKey(`${selectedIndex}`)
  }, [selectedIndex])

  const fieldMap = useMemo(() => {
    const map = {}
    fieldList.forEach((item) => {
      map[item.colName] = item
    })
    return map
  }, [fieldList])

  const options = (state.mode === 1 && state.defaultReportType === 'TABLE') ? paramMap : dimensionMap

  const anchorFieldList = useMemo(() => {
    const list = []
    Object.keys(options).filter((key) => {
      return drillList.indexOf(key) === -1
    })
      .forEach((key) => {
        const item = fieldMap[key]
        if (item) {
          list.push({ title: formatTagName(item), value: item.colName })
        }
      })

    Object.keys(indexMap).filter((key) => {
      return drillList.indexOf(key) === -1
    })
      .forEach((key) => {
        const item = fieldMap[key]
        if (item) {
          list.push({ title: formatTagName(item), value: item.colName })
        }
      })

    return list
  }, [options, indexMap, anchorList, fieldMap, drillList])

  const onAdd = () => {
    if (anchorFieldList.length) {
      props.onAdd && props.onAdd()
    } else {
      message.warn('????????????????????????')
    }
  }

  const onSelect = ({ key }) => {
    props.onSelect && props.onSelect(key)
  }

  const onDel = (index) => {
    props.onDel && props.onDel(index)
  }

  const onSelectMenu = (value, index) => {
    props.onSelectMenu && props.onSelectMenu(value, index)
  }

  const onEdit = (index) => {
    props.onEdit && props.onEdit(index)
  }

  const anchorListNode = useMemo(() => {
    if (Object.keys(fieldMap).length === 0) {
      return null
    }
    return anchorList.map(({ fromParam, isEdit }, index) => {
      const field = fieldMap[fromParam] || {}

      if (isEdit) {
        return (
          <Menu.Item key={index} className={style.modalMenuItem}>
            <Select
              value={field.colName}
              style={{ width: 150 }}
              showSearch
              placeholder="??????????????????"
              filterOption={filterOption}
              onSelect={value => onSelectMenu(value, index)}
            >
              {
                anchorFieldList.map((item, i) => (
                  <Option value={item.value} key={i}>{item.title}</Option>
                ))
              }
            </Select>
            <DeleteOutlined onClick={() => onDel(index)} />
          </Menu.Item>
        )
      }
      return (
        <Menu.Item key={index}>
          <div className={style.modalMenuItem}>
            <span className={style.modalMenuItemLable}>{formatTagName(field)}</span>
            <span>
              <FormOutlined onClick={() => onEdit(index)} />
              <DeleteOutlined onClick={() => onDel(index)} />
            </span>
          </div>
        </Menu.Item>
      )
    })
  }, [anchorList, fieldMap, anchorFieldList])

  return (
    <div>
      <div>
        <a onClick={onAdd}>??????????????????</a>
      </div>
      <Menu selectedKeys={[selectedKey]} onSelect={onSelect}>
        {anchorListNode}
      </Menu>
    </div>
  )
}

const formItemLayout = {
  labelCol: {
    sm: { span: 5 },
  },
  wrapperCol: {
    sm: { span: 12 },
  },
}

function AnchorForm (props) {
  const { resourceList, drillList, data, anchorList, selectedIndex } = props
  const [showTarget, setShowTarget] = useState(data.showTarget)
  const onShowTargetChange = (e) => {
    setShowTarget(e.target.value)
  }

  useEffect(() => {
    setShowTarget(data.showTarget)
  }, [data.showTarget])

  return (
    <Form
      {...formItemLayout}
      name="AnchorForm"
      form={props.form}
      requiredMark={false}
      onValuesChange={props.onChange}
    >
      <Form.Item label="????????????" name="showTarget">
        <Radio.Group onChange={onShowTargetChange}>
          <Radio value={false}>???????????????</Radio>
          <Radio value>???????????????</Radio>
        </Radio.Group>
      </Form.Item>

      {!showTarget
        ? <Form.Item label="??????????????????" name="resourceType">
          <Radio.Group>
            <Radio value="report">??????</Radio>
            <Radio value="dashboard">?????????</Radio>
          </Radio.Group>
        </Form.Item>
        : null}

      <Form.Item
        label="????????????" name="targetName" rules={[
          {
            // ??????????????????????????????????????????
            validator (rule, value) {
              const list = anchorList.filter(item => item.fromParam === data.fromParam)
              if (list.length > 1 && !value) {
                return Promise.reject(new Error('??????'))
              }
              return Promise.resolve()
            },
            message: '?????????????????????',
          }, {
            // ???????????????????????????
            validator (rule, value) {
              const list = anchorList.filter((item, i) =>
                item.fromParam === data.fromParam && i !== Number(selectedIndex))
              for (const item of list) {
                if (value && item.targetName === value) {
                  return Promise.reject(new Error('??????'))
                }
              }
              return Promise.resolve()
            },
            message: '?????????????????????????????????????????????',
          },
        ]}
      >
        <Input />
      </Form.Item>

      {!showTarget
        ? <Form.Item
            label="??????????????????" name="resourceId" rules={[
              { required: true, message: '???????????????' },
            ]}
        >
          <Select
            className="select-size-l" allowClear showSearch filterOption={filterOption}
          >
            {resourceList.map(({ id, title }) => {
              return <Option key={id} value={id}>{title}</Option>
            })}
          </Select>
        </Form.Item>
        : null}

      {showTarget
        ? <Form.Item label="??????????????????" name="targetURL">
          <TextArea placeholder="??????????????????????????????url???????????????https://www.baidu.com" />
        </Form.Item>
        : null}

      {drillList.length
        ? <Form.Item label="????????????" name="layer">
          <Select className="select-size-l">
            <Option value="ALL_LAYER">??????</Option>
            {drillList.map((key) => {
              return <Option key={key}>{key}</Option>
            })}
          </Select>
        </Form.Item>
        : null}

      <Form.Item label="????????????" name="openMode">
        <Radio.Group>
          <Radio value="BLANK">?????????</Radio>
          <Radio value="SELF">????????????</Radio>
          {data.resourceType === 'report' || showTarget
            ? <Radio value="MODAL">??????</Radio>
            : null}
        </Radio.Group>
      </Form.Item>
    </Form>
  )
}

function LinkParamsForm (props) {
  const [configWay, setConfigWay] = useState(props.activeItem.configWay)
  const { theResourceParams = [], targetColList = [], showTarget } = props.options
  const onConfigWayChange = (e) => {
    setConfigWay(e.target.value)
  }

  useEffect(() => {
    setConfigWay(props.activeItem.configWay)
  }, [props.activeItem])

  // ??????
  const repeatValidator = (type) => {
    return (_, value) => {
      const _paramMap = { ...props.paramMap }
      // ???????????????????????????
      delete _paramMap[props.activeItem.fieldKey]
      const keys = Object.keys(_paramMap)
      return (
        type === 'key'
          ? keys
          : keys.reduce((total, k) => {
            total.push(_paramMap[k])
            return total
          }, [])
      ).indexOf(value) >= 0
        ? Promise.reject(new Error('??????'))
        : Promise.resolve()
    }
  }

  return (
    <Form
      name="LinkParamsForm"
      labelCol={{ sm: { span: 8 } }}
      wrapperCol={{ sm: { span: 16 } }}
      form={props.form}
    >
      <Form.Item label="????????????" name="configWay">
        <Radio.Group onChange={onConfigWayChange} disabled={props.activeItem.isEdit}>
          <Radio value="standard">????????????</Radio>
          <Radio value="custom">???????????????</Radio>
        </Radio.Group>
      </Form.Item>

      {configWay === 'custom'
        ? <Form.Item
            label="??????????????????" name="customParam"
            rules={[
              { required: true, message: '???????????????????????????' },
              { max: 512, message: '????????????512' },
            ]}
        >
          <TextArea />
        </Form.Item>
        : <>
          <Form.Item
            label="????????????" name="fieldKey"
            rules={[
              { required: true, message: '?????????????????????' },
              { validator: repeatValidator('key'), message: '??????????????????' },
            ]}
          >
            <Select
              showSearch
              placeholder="??????????????????"
              filterOption={filterOption}
            >
              {theResourceParams.map(({ title, value }) => (
                <Select.Option key={value}>{title}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          {showTarget
            ? <Form.Item
                label="??????????????????" name="targetField"
                rules={[
                  { required: true, message: '???????????????????????????' },
                  { validator: repeatValidator('value'), message: '????????????????????????' },
                ]}
            >
              <Input placeholder="????????????????????????" />
            </Form.Item>
            : <Form.Item
                label="??????????????????" name="targetFieldKey"
                rules={[
                  { required: true, message: '???????????????????????????' },
                  { validator: repeatValidator('value'), message: '????????????????????????' },
                ]}
            >
              <Select
                showSearch
                placeholder="????????????????????????"
                filterOption={filterOption}
              >
                {targetColList.map(({ title, value }) => (
                  <Select.Option key={value}>{title}</Select.Option>
                ))}
              </Select>
            </Form.Item>}
        </>}
    </Form>
  )
}

function filterOption (input, option) {
  return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
}
