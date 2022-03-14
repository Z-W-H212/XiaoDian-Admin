import { useState, useMemo, useEffect, useRef } from 'react'
import { Tree, Input, Button, Spin, Dropdown, Space, Typography } from 'antd'
import { PlusOutlined, EllipsisOutlined, DownOutlined, SearchOutlined } from '@ant-design/icons'
import debounce from 'lodash/debounce'
import style from './style.module.less'

const Group = (props) => {
  const {
    actionRef,
    itemMenuRender,
    params,
    draggable,
    defaultSelectedKey,
    defaultSelectTitle,
    isDisplay,
    renderItem,
    onRequest,
    onDrag,
    onSelect,
    onCreateGroup,
  } = props
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [expandedKeys, setExpandedKeys] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [autoExpandParent, setAutoExpandParent] = useState(true)
  const [selectedKeys, setSelectedKeys] = useState(defaultSelectedKey)
  const antdTreeWrap = useRef()

  useEffect(() => {
    setSelectedKeys(defaultSelectedKey)
  }, [defaultSelectedKey])

  const handleRequest = async () => {
    setLoading(true)
    setDataSource([])
    const result = await onRequest(params)
    setDataSource(result)
    setLoading(false)
  }

  /**
   * 把 treeData 打扁平，方便搜索
   */
  const getFlatTree = useMemo(() => {
    const result = []
    function flat (data) {
      for (let i = 0; i < data.length; i++) {
        const { key, title, parentKey, resourceType, children, ...arg } = data[i]
        result.push({ key, title, parentKey, resourceType, ...arg })
        if (children) {
          flat(children)
        }
      }
    }
    flat(dataSource)
    return result
  }, [dataSource])

  let res = []
  const getParentKey = (key, tree, loop = []) => {
    if (!tree) return []
    for (let i = 0; i < tree.length; i++) {
      if (tree[i].key === key) {
        loop.push(tree[i].key)
        res = loop
        return loop
      } else if (tree[i].children) {
        loop.push(tree[i].key)
        getParentKey(key, tree[i].children, [].concat(loop))
        loop.pop(tree[i].key)
      }
    }
    return res
  }
  /**
   * 渲染搜索结果关键词标红
   */
  const renderTree = useMemo(() => {
    if (searchValue && expandedKeys.length === 0) return []
    function dep (data) {
      const list = data
        .filter((item) => {
          if (searchValue) {
            if (expandedKeys.length > 0) {
              return expandedKeys.indexOf(item.key) > -1
            }
            return true
          }
          return true
        })
        .map((item) => {
          const titleMap = {
            1: '报表',
            2: '仪表盘',
            3: '数据导入模板',
            4: '链接',
            5: '功能按钮',
            6: '数据集',
            7: '接口',
          }

          let subTitle
          if (item.props?.type === '2') {
            subTitle = '模块'
          } else if (titleMap[item.resourceType]) {
            subTitle = titleMap[item.resourceType]
          }
          const title = (
            <div className={style.folderItem}>
              <Typography.Text ellipsis>
                {renderItem ? renderItem(item.title, item) : item.title}
                {subTitle ? <span className={style.subTitle}>{subTitle}</span> : null}
              </Typography.Text>
              {itemMenuRender && (
                <Dropdown overlay={itemMenuRender(item, getFlatTree, dataSource)}>
                  <div className={style.folderDropmenu}>
                    <EllipsisOutlined className={style.folderDropmenuIcon} />
                  </div>
                </Dropdown>
              )}
            </div>
          )

          const menu = {
            title,
            parentKey: item.parentKey,
            props: item.props,
            key: item.key,
          }

          if (item.children) {
            return { ...menu, children: dep(item.children) }
          }

          return menu
        })
      return list
    }
    return dep(dataSource)
  }, [dataSource, getFlatTree, itemMenuRender, searchValue, expandedKeys])

  const handleExpand = (keys) => {
    setExpandedKeys(keys)
    setAutoExpandParent(false)
  }

  const handleSeachInput = (e) => {
    const { value } = e.target

    let keys = []
    const treeCode = getFlatTree.filter(i => String(i.title).toUpperCase()
      .indexOf(value.toUpperCase()) > -1)
    if (value) {
      for (let i = 0; i < treeCode.length; i++) {
        const list = getParentKey(treeCode[i].key, dataSource, [])
        keys.push.apply(keys, list)
      }
    } else {
      keys = []
    }
    setExpandedKeys([...new Set(keys).values()])
    setSearchValue(value)
    setAutoExpandParent(true)
  }

  useEffect(() => {
    handleRequest()
  }, [JSON.stringify(params)])

  useEffect(() => {
    const action = {
      reload: handleRequest,
    }

    if (actionRef) {
      if (typeof actionRef === 'function') {
        actionRef(action)
      } else {
        actionRef.current = action
      }
    }
  }, [JSON.stringify(params)])

  const animationFrameCallBack = () => {
    setSelectedKeys(defaultSelectedKey)
    const spanList = document.querySelectorAll('span.ant-tree-node-content-wrapper')
    for (const span of spanList) {
      if (defaultSelectTitle === span.innerText) {
        const paraentOffsetTop = span.offsetTop || 0
        if (paraentOffsetTop) {
          antdTreeWrap.current.scrollTo(0, paraentOffsetTop)
        }
        return
      }
    }
  }

  useEffect(() => {
    const animationId = window.requestAnimationFrame(animationFrameCallBack)
    return () => {
      window.cancelAnimationFrame(animationId)
    }
  }, [])

  const onDragEnter = () => {

  }

  const onDrop = (info) => {
    const dropKey = info.node.key
    const dragKey = info.dragNode.key
    const dropPos = info.node.pos.split('-')
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1])

    const data = [...dataSource]

    const loop = (data, key, callback) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].key === key) {
          return callback(data[i], i, data)
        }
        if (data[i].children) {
          loop(data[i].children, key, callback)
        }
      }
    }

    let dragObj
    loop(data, dragKey, (item, index, arr) => {
      arr.splice(index, 1)
      dragObj = item
    })

    if (!info.dropToGap) {
      // Drop on the content
      loop(data, dropKey, (item) => {
        item.children = item.children || []
        // where to insert 示例添加到头部，可以是随意位置
        item.children.unshift(dragObj)
      })
    } else {
      let ar
      let i
      loop(data, dropKey, (item, index, arr) => {
        ar = arr
        i = index
      })
      if (dropPosition === -1) {
        ar.splice(i, 0, dragObj)
      } else {
        ar.splice(i + 1, 0, dragObj)
      }
    }

    onDrag(data)
  }

  const draggableConfig = {
    draggable,
    allowDrop: () => !searchValue,
    onDragEnter,
    onDrop,
  }

  return (
    <div className={style.folderContainer}>
      <Spin spinning={loading}>
        <Space align="start" className={style.groupHeader}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="请输入"
            onChange={debounce(handleSeachInput, 200)}
            style={{ marginRight: '8px' }}
          />
          {!isDisplay && onCreateGroup && <Button icon={<PlusOutlined />} onClick={() => onCreateGroup(getFlatTree)} />}
        </Space>
        {searchValue && expandedKeys.length === 0 ? <div className={style.nothing}>查询结果为空</div> : null}
        <div className={style.groupBody} ref={antdTreeWrap}>
          <Tree
            blockNode
            showIcon
            {...draggable ? draggableConfig : null}
            switcherIcon={<DownOutlined />}
            onExpand={handleExpand}
            expandedKeys={expandedKeys}
            autoExpandParent={autoExpandParent}
            treeData={renderTree}
            defaultSelectedKeys={[defaultSelectedKey]}
            selectedKeys={[selectedKeys]}
            onSelect={(keys) => {
              const keyItem = getFlatTree.find(i => i.key === keys[0])
              if (keyItem) {
                onSelect(keys[0], keyItem)
                setSelectedKeys(keys[0])
              }
            }}
          />
        </div>
      </Spin>
    </div>
  )
}

export default Group
