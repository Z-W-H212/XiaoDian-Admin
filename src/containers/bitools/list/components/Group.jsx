import {
  useState,
  useMemo,
  useEffect,
  useRef,
} from 'react'
import {
  Space,
  Tree,
  Input,
  Button,
  Modal,
  Form,
  Spin,
  Dropdown,
  Menu,
  TreeSelect,
  message,
} from 'antd'
import {
  SearchOutlined,
  PlusOutlined,
  EllipsisOutlined,
  ExclamationCircleOutlined,
  DownOutlined,
  FileSyncOutlined,
  UserOutlined,
  FolderOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons'
import {
  addTreeGroup,
  renameTreeGroup,
  moveTreeGroup,
  delTreeGroup,
} from '@/services/reportService'
import { getUserInfo } from '@/services/permissionService'
import style from './style.module.less'
import BaseModal from './BaseModal'
import { cloneDeep } from 'lodash'

const MODEL_NAME = {
  RENAME: 'RENAME',
  CREATE: 'CREATE',
  CREATE_CHILDREN: 'CREATE_CHILDREN',
  MOVE: 'MOVE',
  DEL: 'DEL',
}

const Group = ({
  height,
  loading,
  bizType,
  groupData: groupDataSource,
  defaultSelectedKey = '',
  additionalExpandedKeys = [],
  onChange,
  onSelect,
  onExpandTree,
  onReloadReportTable,
}) => {
  const [selectedKeys, setSelectedKeys] = useState(defaultSelectedKey)
  const [expandedKeys, setExpandedKeys] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [autoExpandParent, setAutoExpandParent] = useState(true)
  const [modelFormProps, setModelFormProps] = useState(null)
  const [userInfo, setUserInfo] = useState()
  const antdTreeWrap = useRef()

  useEffect(() => {
    getUserInfo().then((r) => {
      setUserInfo(r)
    })
  }, [])

  useEffect(() => {
    setSelectedKeys(defaultSelectedKey)
  }, [defaultSelectedKey])

  useEffect(() => {
    if (additionalExpandedKeys) {
      const curExpandedKeys = cloneDeep(expandedKeys)
      curExpandedKeys.push(...additionalExpandedKeys)
      setExpandedKeys(Array.from(new Set(curExpandedKeys)))
    }
  }, [additionalExpandedKeys])

  useEffect(() => {
    groupDataSource && groupDataSource.length && !defaultSelectedKey && setSelectedKeys([])
  }, [groupDataSource])

  const groupData = useMemo(() => {
    return groupDataSource[0] ? groupDataSource[0].children : []
  }, [groupDataSource])

  const groupDataRoot = useMemo(() => {
    if (!groupDataSource[0]) {
      return []
    }
    const tree = [{
      title: '?????????',
      key: '0',
      children: groupDataSource[0].children.slice(2),
    }]

    return tree
  }, [groupDataSource])

  /**
   * ??? treeData ????????????????????????
   */
  const getFlatTree = useMemo(() => {
    const result = []
    function flat (data) {
      for (let i = 0; i < data.length; i++) {
        const { key, title, children } = data[i]
        result.push({ key, title })
        if (children) {
          flat(children)
        }
      }
    }
    flat(groupData)
    return result
  }, [groupData])

  /**
   * ??????????????? key ??????????????????
   */
  const getParentKey = (key, tree) => {
    let parentKey
    for (let i = 0; i < tree.length; i++) {
      const node = tree[i]
      if (node.children) {
        if (node.children.some(item => item.key === key)) {
          parentKey = node.key
        } else if (getParentKey(key, node.children)) {
          parentKey = getParentKey(key, node.children)
        }
      }
    }
    return parentKey
  }

  /**
   * ?????????????????????????????????
   */
  const renderTree = useMemo(() => {
    const renderDropdown = item => (
      <Dropdown
        overlay={(
          <Menu>
            <Menu.Item
              onClick={() => {
                setModelFormProps({
                  model: MODEL_NAME.CREATE_CHILDREN,
                  values: { parentId: item.key },
                })
              }}
            >
              ??????
            </Menu.Item>
            <Menu.Item
              onClick={() => {
                setModelFormProps({
                  model: MODEL_NAME.RENAME,
                  values: { id: item.key, name: item.title },
                })
              }}
            >
              ?????????
            </Menu.Item>
            <Menu.Item
              onClick={() => {
                setModelFormProps({
                  model: MODEL_NAME.MOVE,
                  values: { id: item.key, name: item.title },
                })
              }}
            >
              ?????????
            </Menu.Item>
            <Menu.Item
              onClick={() => {
                const modelInstance = Modal.confirm({
                  title: '???????????????????????????????????????',
                  icon: <ExclamationCircleOutlined />,
                  async onOk () {
                    await delTreeGroup({ id: item.key })
                    message.success('?????????????????????')
                    modelInstance.destroy()
                    setModelFormProps(null)
                    onChange()
                  },
                })
              }}
            >
              ??????
            </Menu.Item>
          </Menu>
        )}
      >
        <div className={style.folderDropmenu}>
          <EllipsisOutlined className={style.folderDropmenuIcon} />
        </div>
      </Dropdown>
    )

    function dep (data) {
      return data.map((item) => {
        const index = item.title.indexOf(searchValue)
        const beforeStr = item.title.substr(0, index)
        const afterStr = item.title.substr(index + searchValue.length)
        const title = (
          <div className={style.folderItem}>
            <div>
              {
              index > -1
                ? (
                  <>
                    {beforeStr}
                    <span style={{ color: '#f50', fontWeight: 'bold' }}>{searchValue}</span>
                    {afterStr}
                  </>
                )
                : item.title
            }
            &nbsp;({item.props?.nodeSize})
            </div>
            {(+item.key) > 0 && renderDropdown(item)}
          </div>
        )

        const menu = {
          title,
          key: item.key,
          icon (props) {
            if (props.data.key === '-2') {
              return <FileSyncOutlined />
            }
            if (props.data.key === '-1') {
              return <UserOutlined />
            }

            return props.expanded ? <FolderOpenOutlined /> : <FolderOutlined />
          },
        }

        if (item.children) {
          return { ...menu, children: dep(item.children) }
        }

        return menu
      })
    }
    return dep(groupData)
  }, [groupData, onChange, searchValue])

  const handleExpand = (keys) => {
    setExpandedKeys(keys)
    setAutoExpandParent(false)
    onExpandTree && onExpandTree(keys)
  }

  const handleSeachInput = (e) => {
    const { value } = e.target

    if (value) {
      const keys = getFlatTree
        .map((item) => {
          if (item.title.indexOf(value) > -1) {
            return getParentKey(item.key, groupData)
          }
          return null
        })
        .filter((item, i, self) => item && self.indexOf(item) === i)

      setExpandedKeys(keys)
    }

    setSearchValue(value)
    setAutoExpandParent(true)
  }

  const defaultModelFormProps = {
    visible: !!modelFormProps,
    onCancel: () => setModelFormProps(null),
    ...modelFormProps,
  }

  return (
    <>
      <Spin spinning={loading}>
        <Space align="start" className={style.groupHeader}>
          <Input
            style={{ marginRight: '8px' }}
            allowClear
            placeholder="?????????"
            prefix={<SearchOutlined />}
            onChange={handleSeachInput}
          />
          {!!userInfo?.adminModal &&
            <Button
              icon={<PlusOutlined />}
              onClick={() => setModelFormProps({
                model: MODEL_NAME.CREATE,
                values: { parentId: 0 },
              })}
            />}
        </Space>

        <div
          className={style.groupBody}
          ref={antdTreeWrap}
          style={height ? { height } : null}
        >
          <Tree
            blockNode
            showIcon
            switcherIcon={<DownOutlined />}
            onExpand={handleExpand}
            selectedKeys={[selectedKeys]}
            expandedKeys={expandedKeys}
            autoExpandParent={autoExpandParent}
            treeData={renderTree}
            onSelect={(keys) => {
              onSelect(keys[0])
              setSelectedKeys(keys[0])
            }}
          />
        </div>

      </Spin>

      {
        modelFormProps?.model === MODEL_NAME.RENAME && (
          <BaseModal
            {...defaultModelFormProps}
            title="?????????"
            onSubmit={async ({ id, name }) => {
              await renameTreeGroup({ id, name })
              message.success('???????????????')
              setModelFormProps(null)
              onChange()
              typeof onReloadReportTable === 'function' && onReloadReportTable()
            }}
          >
            <Form.Item label="???????????????">
              {modelFormProps.values.name}
            </Form.Item>
            <Form.Item
              name="name"
              label="???????????????"
              required
              rules={[
                { max: 40, message: '????????????40?????????' },
                () => ({
                  async validator (_, value) {
                    if (!value) {
                      return Promise.reject(Error('????????????????????????!'))
                    }
                    const result = getFlatTree.find(e => e.title === value)
                    if (result) {
                      return Promise.reject(Error('??????????????????'))
                    }
                  },
                }),
              ]}
            >
              <Input />
            </Form.Item>
          </BaseModal>
        )
      }

      {
        (
          modelFormProps?.model === MODEL_NAME.CREATE ||
          modelFormProps?.model === MODEL_NAME.CREATE_CHILDREN) &&
          (
            <BaseModal
              {...defaultModelFormProps}
              title="???????????????"
              onSubmit={async ({ name, parentId }) => {
                await addTreeGroup({ parentId, bizType, name })
                message.success('?????????????????????')
                setModelFormProps(null)
                onChange()
              }}
            >
              <Form.Item
                name="name"
                required
                label="????????????"
                rules={[
                  { max: 40, message: '????????????40?????????' },
                  () => ({
                    async validator (_, value) {
                      if (!value) {
                        return Promise.reject(Error('????????????????????????!'))
                      }
                      const result = getFlatTree.find(e => e.title === value)
                      if (result) {
                        return Promise.reject(Error('??????????????????'))
                      }
                    },
                  }),
                ]}
              >
                <Input />
              </Form.Item>
              {
              modelFormProps?.model === MODEL_NAME.CREATE &&
              (
                <Form.Item name="parentId" required label="???????????????">
                  <TreeSelect
                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                    treeData={groupDataRoot}
                    placeholder="????????????????????????"
                    treeDefaultExpandAll
                  />
                </Form.Item>
              )
            }
            </BaseModal>
          )
      }

      {
        modelFormProps?.model === MODEL_NAME.MOVE &&
        (
          <BaseModal
            {...defaultModelFormProps}
            title="???????????????"
            onSubmit={async ({ id, moveTo }) => {
              await moveTreeGroup({ id, moveTo })
              message.success('?????????????????????')
              setModelFormProps(null)
              onChange()
            }}
          >
            <Form.Item label="????????????">
              {modelFormProps.values.name}
            </Form.Item>
            <Form.Item name="moveTo" label="???????????????">
              <TreeSelect
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                treeData={groupDataRoot}
                placeholder="????????????????????????"
                treeDefaultExpandAll
                showSearch
                treeNodeFilterProp="title"
              />
            </Form.Item>
          </BaseModal>
        )
      }
    </>
  )
}

export default Group
