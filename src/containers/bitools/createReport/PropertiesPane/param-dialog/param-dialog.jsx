import { useEffect, useContext, useState, useMemo } from 'react'
import '@ant-design/compatible/assets/index.css'
import { Modal, Button, Dropdown, Menu, message, Input, Tooltip, Form } from 'antd'
import Paragraph from '@/components/layout/Paragraph'
import RichTree from '@/components/base/RichTree'
import FilterForm from '@/components/filter-form'

import HierarchyInfo from './hierarchy-info.jsx'
import Context from '../../Context'
import formatTagName from '@/utils/format-tag-name'
import style from './style.module.less'

const { Block, Content } = Paragraph

function stringifyLovList (list) {
  let text = ''
  list.forEach((item) => {
    const { value, title } = item
    let str = value
    if (title) {
      str += `=${title}`
    }
    text += `${str}\r\n`
  })
  return text
}

export default function ParamDialog (props) {
  const { state, dispatch } = useContext(Context)
  const [paramMap, setParamMap] = useState({})
  const [formInstance] = Form.useForm()
  const [customCode, setCustomCode] = useState(false)
  const [selectedKey, setSelected] = useState()
  const [search, setSearch] = useState()

  useEffect(() => {
    const map = {}
    Object.keys(state.paramMap).forEach((key) => {
      const item = state.paramMap[key]
      const { paramName, label, checked, colType, dataType, lovValueList } = item

      if (checked) {
        map[key] = { ...item, id: paramName, title: label, dataType: colType || dataType }
        if (item.isStaticLov) {
          map[key].lovValueText = stringifyLovList(lovValueList)
        }
      }
    })
    setParamMap(map)
  }, [state.paramMap])
  const onOk = () => {
    const fieldListCopy = [...state.fieldList]
    const keys = Object.keys(paramMap)
    const activeItem = paramMap[selectedKey]
    state.fieldList.forEach((e, i) => {
      if (keys.indexOf(e.colName) >= 0) {
        fieldListCopy[i]._source = 'conflict'
      }
    })
    if (activeItem && activeItem.showDefaultVal && activeItem.componentType.includes('NUMBER')) {
      switch (activeItem.componentType) {
        case 'NUMBER_MIN':
          if (!activeItem.valDefault) return message.warn('请完善默认值')
          break
        case 'NUMBER_MAX':
          if (!activeItem.valDefault) return message.warn('请完善默认值')
          break
        default:
          if (
            !(activeItem.valDefault instanceof Array &&
            activeItem.valDefault.length === 2 &&
            (activeItem.valDefault[0] || activeItem.valDefault[0] === 0) &&
            (activeItem.valDefault[1] || activeItem.valDefault[1] === 0))
          ) return message.warn('请完善默认值')
          if (activeItem.valDefault[0] > activeItem.valDefault[1]) return message.warn('最小值不能大于最大值')
      }
    }
    dispatch({ type: 'setParamMap', payload: { paramMap } })
    dispatch({ type: 'setFieldList', payload: { fieldList: fieldListCopy } })
    props.onOk && props.onOk()
  }

  const onAddKey = ({ key }) => {
    const { colName, colType, ...arg } = state.paramMap[key]
    const title = formatTagName(arg)
    const data = {
      id: colName,
      title,
      paramName: colName,
      label: title,
      visible: true,
      dataType: colType,
      checked: true,
    }
    if (colName === '#hierarchy#') {
      data.componentType = 'SELECT'
      data.dataType = 'STRING'
    }

    setSelected(colName)
    setParamMap({
      ...paramMap,
      [colName]: data,
    })
  }

  const onSelect = (keys) => {
    setSelected(keys[0])
  }

  const onTreeChange = (data) => {
    setParamMap(data)
  }

  const onFormChange = (data) => {
    const { id, label, dataType, sequence, visible } = paramMap[selectedKey]

    const param = {
      ...data,
      checked: true,
      id,
      label,
      title: label,
      dataType,
      paramName: selectedKey,
      sequence,
      visible,
      // 如果是 手工输入 则需要清空 lovReportId  以免 手工输入的无效
      lovReportId: data.isStaticLov ? null : data.lovReportId,
    }

    const map = { ...paramMap }
    map[selectedKey] = { ...param }
    setParamMap(map)
  }

  const formData = useMemo(() => {
    return paramMap[selectedKey]
  }, [paramMap, selectedKey])

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

  const addCustomCode = () => {
    setCustomCode(true)
    formInstance.resetFields('')
  }

  const customSure = async () => {
    const { colAlias } = await formInstance.validateFields()
    setParamMap({
      ...paramMap,
      [colAlias]: {
        id: colAlias,
        title: colAlias,
        checked: true,
        paramName: colAlias,
        label: colAlias,
        dataType: 'SPECIAL',
        visible: true,
      },
    })
    setCustomCode(false)
    setSelected(colAlias)
  }
  const menu = (
    <div className={style.menu}>
      <Input
        className={style.input}
        value={search}
        allowClear
        placeholder="搜索关键字"
        onClick={(event) => {
          event.stopPropagation()
        }}
        onChange={e => setSearch(e.target.value)}
      />
      <Menu onClick={onAddKey} style={{ width: 220 }}>
        {paramList.filter(({ tagAlias, colAlias, colName }) => {
          return !search || (
            tagAlias?.indexOf(search) >= 0 ||
            colAlias?.indexOf(search) >= 0 ||
            colName?.indexOf(search) >= 0
          )
        }).map((item) => {
          const title = formatTagName(item)
          return (
            <Menu.Item key={item.colName} className={style.menuItem}>
              <Tooltip placement="right" title={title}>
                {item.colName === '#hierarchy#' ? <b>{title}</b> : title}
              </Tooltip>
            </Menu.Item>
          )
        })}
      </Menu>
      <a
        className={style.addParams}
        onClick={addCustomCode}
      >新增自定义字段</a>
    </div>
  )

  const children = useMemo(() => {
    if (!selectedKey) { return }

    if (selectedKey === '#hierarchy#') {
      return <HierarchyInfo />
    }
    return (
      <FilterForm
        key={selectedKey}
        data={formData}
        indexItem={state.indexMap[selectedKey]}
        showAggregate={state.mode === 0}
        onChange={onFormChange}
      />
    )
  }, [selectedKey, formData, paramMap])

  return (
    <>
      <Modal
        className={style.dialog}
        title="筛选器设置"
        visible
        onOk={onOk}
        onCancel={props.onCancel}
      >
        <Paragraph>
          <Block className={style.sider}>
            <Dropdown overlay={menu} trigger={['click']}>
              <div className={style.add}>
                <Button className={style.button} onClick={() => setSearch('')}>
                  <i className="iconfont iconplus" />
                  添加筛选器
                </Button>
              </div>
            </Dropdown>
            <RichTree
              data={paramMap}
              tools={['visible', 'edit', 'del']}
              transform={({ paramName, label }) => ({ paramName, label })}
              onSelect={onSelect}
              onChange={onTreeChange}
              onBeforeDel={() => setSelected()}
            />
          </Block>
          <Content padding={8}>{children}</Content>
        </Paragraph>
      </Modal>
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
                  for (const item in paramMap) {
                    if (paramMap[item].colAlias === value) {
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
    </>
  )
}
