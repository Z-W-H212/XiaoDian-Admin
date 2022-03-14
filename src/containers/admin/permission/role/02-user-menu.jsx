import { useRef, useEffect, useState, useMemo } from 'react'
import ProTable from '@ant-design/pro-table'
import {
  getRoleMenuList,
  setRoleMenuEnable,
  setRoleMenuDisable,
  setRoleMenuEnableNode,
  setRoleMenuDisableNode,
} from '@/services/admin/permission-role'
import { Space, Input, Tabs } from 'antd'
import AsyncCheckbox from '@/components/async-checkbox'
import { SearchOutlined } from '@ant-design/icons'

export default ({ roleId }) => {
  const actionRef = useRef()
  const [tableParams, setTableParams] = useState({})
  const [rowKeys, setRowKeys] = useState([])
  const [dataSource, setDataSource] = useState([])
  const [selectTab, setSelectTab] = useState()
  const [tabData, setTabData] = useState([])
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
      render (arr, row) {
        return (
          <Space>
            {
              Array.isArray(arr) && arr.map((e, i) => (
                <AsyncCheckbox
                  key={e.key}
                  value={e.permission}
                  disabled={e.operateAble === false}
                  onRequest={async (value) => {
                    const params = {
                      authType: e.authType,
                      menuId: row.type === 'node' ? row.key : row.parentKey,
                      resourceId: row.key,
                      targetRoleId: roleId,
                    }
                    if (value) {
                      if (row.type === 'node') {
                        await setRoleMenuEnableNode(params)
                      } else if (row.type === 'leaf') {
                        await setRoleMenuEnable(params)
                      }
                    } else {
                      if (row.type === 'node') {
                        await setRoleMenuDisableNode(params)
                      } else if (row.type === 'leaf') {
                        await setRoleMenuDisable(params)
                      }
                    }
                    await actionRef.current?.reload()
                  }}
                  title={e.title}
                />
              ))
            }
          </Space>
        )
      },
    },
  ]

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
    actionRef.current?.reload()
  }, [roleId])

  /**
   * 获取当前tab表单数据
   */
  const currentDataSrouce = useMemo(() => {
    return dataSource.find(item => item.groupKey === selectTab)?.items || []
  }, [dataSource, selectTab, tabData])
  return (
    <ProTable
      actionRef={actionRef}
      columns={columns}
      params={tableParams}
      headerTitle={(
        <Tabs onChange={setSelectTab} activeKey={selectTab}>
          {
            tabData.map((item, index) => {
              return <Tabs.TabPane key={item.groupKey} tab={item.groupName} />
            })
          }
        </Tabs>
      )}
      dataSource={currentDataSrouce}
      request={async (params) => {
        const result = await getRoleMenuList({
          ...params,
          targetId: roleId,
        })
        if (params.menuName) {
          setRowKeys(flatChildren(result.find(item => item.groupKey === selectTab)?.items))
        } else {
          tabData.length === 0 && setSelectTab(result[0]?.groupKey)
          setTabData([...result])
        }
        setDataSource(result)

        return {
          success: true,
        }
      }}
      expandable={{ expandedRowKeys: rowKeys, onExpandedRowsChange: onExpandedRowsChange }}
      pagination={false}
      scroll={{ x: 1300 }}
      options={false}
      search={false}
      rowKey="key"
    />
  )
}
