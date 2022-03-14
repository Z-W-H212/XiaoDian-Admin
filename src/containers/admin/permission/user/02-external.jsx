import { useState, useRef, useEffect, useMemo } from 'react'
import { Layout, message, Space, Menu, Modal, Input } from 'antd'
import ProTable from '@ant-design/pro-table'
import Group from '@/components/group'
import AsyncCheckbox from '@/components/async-checkbox'
import OrgPicker from '@/components/user-picker'
import { ExclamationCircleOutlined, SearchOutlined } from '@ant-design/icons'
import {
  addExternalUser,
  deleteExternalUser,
  getExternalUserList,
  getExternalMenuList,
  setUserMenuEnable,
  setUserMenuDisable,
  setUserMenuEnableNode,
  setUserMenuDisableNode,
} from '@/services/admin/permission-user'
import { ExternalDataset } from './components/external-dataset'
import BISpace from '../role/05-bispace'

const { Sider, Content } = Layout

const tabDatasetKey = {
  groupKey: '_DATASET',
  groupName: '数据集权限',
}
const biSpace = {
  groupKey: '_BISPACE',
  groupName: 'BI空间权限',
}
const tabs = [tabDatasetKey, biSpace]

function PermissionUserExternal () {
  const [selectedGroup, setSelectGroup] = useState(null)
  const [userPickModal, setUserPickModal] = useState(null)
  const groupActionRef = useRef()
  const tableActionRef = useRef()
  const [tableParams, setTableParams] = useState({})
  const [rowKeys, setRowKeys] = useState([])
  const [dataSource, setDataSource] = useState([])
  const [selectTab, setSelectTab] = useState()
  const [tabData, setTabData] = useState([])
  const [defaultSelectedKey, setDefaultSelectedKey] = useState('')

  /**
   * 用户新增
   */
  const onOrgPickerFinish = async (values) => {
    try {
      const { id } = values
      await addExternalUser(id)
      message.success('添加成功')
      setSelectGroup(id)
      setDefaultSelectedKey(id)
      groupActionRef.current.reload()
    } catch (err) {
      message.error('添加失败')
    }
    setUserPickModal(null)
  }
  const columns = [
    {
      key: 'title',
      dataIndex: 'title',
      title: '菜单名称',
      filterDropdown: () => (
        <div style={{ padding: 8 }}>
          <Input.Search allowClear onSearch={e => setTableParams({ menuName: e })} />
        </div>
      ),
      filterIcon: filtered => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
    },
    {
      key: 'resourceType',
      dataIndex: 'resourceType',
      title: '资源类型',
      valueType: 'select',
      valueEnum: {
        1: {
          text: '报表',
        },
        2: {
          text: '仪表盘',
        },
        3: {
          text: '数据导入模板',
        },
        4: {
          text: '链接',
        },
        5: {
          text: '功能按钮',
        },
        6: {
          text: '数据集',
        },
        7: {
          text: '接口',
        },
      },
    },
    {
      key: 'func',
      dataIndex: 'func',
      title: '功能权限',
      render: (arr, row) => (
        <Space>
          {
            Array.isArray(arr) && arr.map(e => (
              <AsyncCheckbox
                key={e.key}
                value={e.permission}
                disabled={e.operateAble === false}
                onRequest={async (value) => {
                  const params = {
                    authType: e.authType,
                    menuId: row.type === 'node' ? row.key : row.parentKey,
                    resourceId: row.key,
                    targetUserId: selectedGroup,
                  }
                  if (value) {
                    if (row.type === 'node') {
                      await setUserMenuEnableNode(params)
                    } else if (row.type === 'leaf') {
                      await setUserMenuEnable(params)
                    }
                  } else {
                    if (row.type === 'node') {
                      await setUserMenuDisableNode(params)
                    } else if (row.type === 'leaf') {
                      await setUserMenuDisable(params)
                    }
                  }
                  await tableActionRef.current?.reload()
                }}
                title={e.title}
              />
            ))
          }
        </Space>
      ),
    },
  ]

  const itemMenuRender = item => (
    <Menu>
      <Menu.Item
        onClick={() => {
          const modelInstance = Modal.confirm({
            title: '操作不可逆，是否确认删除？',
            icon: <ExclamationCircleOutlined />,
            async onOk () {
              try {
                await deleteExternalUser(item.key)
                message.success('提交成功')
                modelInstance.destroy()
                setSelectGroup(null)
                setDefaultSelectedKey('')
                await groupActionRef.current.reload()
                return true
              } catch (err) {
                message.error('提交失败')
              }
            },
          })
        }}
      >删除</Menu.Item>
    </Menu>
  )

  const flatChildren = (arr = []) => {
    const result = []
    function flat (data) {
      for (let i = 0; i < data.length; i++) {
        const { key, children } = data[i]
        result.push(key)
        if (children) {
          flat(children)
        }
      }
    }
    flat(arr)
    return result
  }

  const onExpandedRowsChange = (rows) => {
    setRowKeys(rows)
  }

  useEffect(() => {
    tableActionRef.current?.reload()
  }, [selectedGroup])

  const currentDataSrouce = useMemo(() => {
    return dataSource.find(item => item.groupKey === selectTab)?.items || []
  }, [dataSource, selectTab])

  const content = () => {
    if (!(selectedGroup)) return null
    switch (selectTab) {
      case tabDatasetKey.groupKey:
        return <ExternalDataset userId={selectedGroup} />
      case biSpace.groupKey:
        return <BISpace userId={selectedGroup} />
      default:
        return (
          <ProTable
            rowKey="key"
            options={false}
            actionRef={tableActionRef}
            columns={columns}
            pagination={false}
            params={tableParams}
            expandable={{ expandedRowKeys: rowKeys, onExpandedRowsChange: onExpandedRowsChange }}
            dataSource={currentDataSrouce}
            request={async (params, sorter, filter) => {
              const result = await getExternalMenuList({
                ...params,
                targetId: selectedGroup,
              })

              if (params.menuName) {
                setRowKeys(flatChildren(result.find(item => item.groupKey === selectTab)?.items))
              } else {
                tabData.length === 0 && setSelectTab(result[0]?.groupKey)
                setTabData([...result, ...tabs])
              }
              setDataSource(result)

              return {
                success: true,
              }
            }}
            search={false}
            scroll={{ x: 'max-content' }}
          />
        )
    }
  }

  return (
    <>
      <Sider theme="light" width={272} style={{ marginRight: '1px' }}>
        <Group
          defaultSelectedKey={defaultSelectedKey}
          actionRef={groupActionRef}
          itemMenuRender={itemMenuRender}
          onCreateGroup={() => setUserPickModal({})}
          onSelect={async (key) => {
            if (!key) {
              return
            }
            setSelectGroup(key)
            setDefaultSelectedKey('')
            await tableActionRef.current?.reload()
          }}
          onRequest={async () => {
            const result = await getExternalUserList()
            return result.map(e => ({
              key: e.id,
              title: e.nickName,
            }))
          }}
        />
      </Sider>
      <Layout flex="auto">
        <Content>
          <div style={{ background: '#fff' }}>
            <Menu mode="horizontal" onClick={e => setSelectTab(e.key)} defaultSelectedKeys={['0']} selectedKeys={[selectTab]}>
              {
                tabData.map((item) => {
                  return <Menu.Item key={item.groupKey}>{item.groupName}</Menu.Item>
                })
              }
            </Menu>
          </div>
          {content()}
          {/* {
            selectedGroup && (
              Number(selectIndex) === tabData.findIndex(e => e.groupKey === tabDatasetKey.groupKey)
                ? (
                  <ExternalDataset userId={selectedGroup} />
                )
                : (
                  <ProTable
                    rowKey="key"
                    options={false}
                    actionRef={tableActionRef}
                    columns={columns}
                    pagination={false}
                    params={tableParams}
                    expandable={{ expandedRowKeys: rowKeys, onExpandedRowsChange: onExpandedRowsChange }}
                    dataSource={currentDataSrouce}
                    request={async (params, sorter, filter) => {
                      const result = await getExternalMenuList({
                        ...params,
                        targetId: selectedGroup,
                      })

                      if (params.menuName) {
                        setRowKeys(flatChildren(result[selectIndex]?.items))
                      } else {
                        setTabData([...result, ...tabs])
                      }
                      setDataSource(result)

                      return {
                        success: true,
                      }
                    }}
                    search={false}
                    scroll={{ x: 'max-content' }}
                  />
                )
            )
          } */}

        </Content>
      </Layout>

      <OrgPicker visible={userPickModal} onFinish={onOrgPickerFinish} onClose={() => setUserPickModal(null)} />
    </>
  )
}

export default PermissionUserExternal
