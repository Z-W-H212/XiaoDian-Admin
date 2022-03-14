import { useEffect, useMemo } from 'react'
import { Form, Icon as LegacyIcon } from '@ant-design/compatible'
import '@ant-design/compatible/assets/index.css'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Tree, Input } from 'antd'
import { confirm } from '@/utils/alertMessage'
import createFormModal from '@/utils/createFormModal'
import style from './style.module.less'

const { TreeNode } = Tree

const EditFromModal = createFormModal(EditFrom)
function EditFrom (props) {
  const { getFieldDecorator, setFieldsValue } = props.form
  useEffect(() => {
    setFieldsValue(props.data)
  }, [props.data])

  return (
    <Form>
      <Form.Item label="标题">
        {getFieldDecorator('title', {})(<Input />)}
      </Form.Item>
    </Form>
  )
}

function transformMapToTree (data) {
  const keys = Object.keys(data)
  keys.forEach((key) => {
    data[key].children = []
  })
  keys.forEach((key) => {
    const item = data[key]
    if (!item.parentId) {
      return false
    }
    if (data[item.parentId] === undefined) {
      return false
    }
    data[item.parentId].children.push(item)
  })
  const menuTree = []
  keys.forEach((key) => {
    const item = data[key]
    if (item.parentId == null) {
      menuTree.push(item)
    }
    // item.children.sort((a, b) => a.indexStr - b.indexStr)
  })
  // menuTree.sort((a, b) => a.indexStr - b.indexStr)

  return menuTree
}

export default function RichTree (props) {
  const { checkable, disableParentBox, checkedKeys } = props

  const onVisible = (event, node) => {
    event.preventDefault()
    event.stopPropagation()
    const data = { ...props.data }
    data[node.id] = { ...node, visible: !node.visible }
    props.onChange && props.onChange(data)
  }

  const onEdit = async (event, node) => {
    event.preventDefault()
    event.stopPropagation()
    const { title } = await EditFromModal(node)
    const data = { ...props.data }
    data[node.id] = { ...node, title }
    props.onChange && props.onChange(data)
  }

  const onDel = async (event, id) => {
    event.preventDefault()
    event.stopPropagation()
    await confirm('是否删除？')(() => {
      props.onBeforeDel && props.onBeforeDel(id)
      const map = {}
      Object.keys(props.data).forEach((key) => {
        if (props.data[key].id === id) { return false }
        map[key] = props.data[key]
      })
      props.onChange && props.onChange(map)
    })
  }

  const createNodes = (data) => {
    const menuList = []
    for (const node of data) {
      const { children, id, isLeaf } = node

      const title = renderTitle(props, node)
      const disabled = disableParentBox ? false : children.length > 0

      menuList.push(<TreeNode key={id} title={title} disableCheckbox={disabled} isLeaf={isLeaf}>
        {children.length > 0 ? createNodes(children) : null}
      </TreeNode>)
    }
    return menuList
  }

  function renderTitle (props, node) {
    const { renderTitle } = props
    const tools = props.tools || []
    const { visible, title, id } = node
    if (renderTitle) {
      return renderTitle(title, id)
    }
    const children = [
      <div key="title" className={style.nodeTitle}>{title}</div>,
    ]
    if (tools.indexOf('visible') > -1) {
      children.push(<LegacyIcon
        key="visible"
        className={style.icon}
        type={visible ? 'eye' : 'eye-invisible'}
        onClick={e => onVisible(e, node)}
      />)
    }
    if (tools.indexOf('edit') > -1) {
      children.push(<EditOutlined key="edit" className={style.icon} onClick={e => onEdit(e, node)} />)
    }
    if (tools.indexOf('del') > -1) {
      children.push(<DeleteOutlined key="del" className={style.icon} onClick={e => onDel(e, id)} />)
    }

    return <div className={style.row}>{children}</div>
  }

  const nodes = useMemo(() => {
    if (props.data) {
      const list = transformMapToTree(props.data)
      return createNodes(list)
    }
  }, [props.data])

  return (
    <Tree
      {...props}
      blockNode
      checkable={checkable}
      checkStrictly={props.checkStrictly}
      checkedKeys={checkedKeys}
      onCheck={props.onCheck}
    >
      {nodes}
    </Tree>
  )
}
