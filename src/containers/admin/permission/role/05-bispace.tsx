import { useState, useRef, useEffect } from 'react'
import ProTable from '@ant-design/pro-table'
import { Space, Input, Tabs } from 'antd'
import { SearchOutlined, FolderOutlined } from '@ant-design/icons'
import AsyncCheckbox from '@/components/async-checkbox'
import {
  getBiGroupTree,
  addRoleBiGroupFolderAuth,
  cancelRoleBiGroupFolderAuth,
} from '@/services/admin/permission-role'

import {
  getUserBiGroupTree,
  addUserBiGroupFolderAuth,
  cancelUserBiGroupFolderAuth,
} from '@/services/admin/permission-user'

interface IProps {
  roleId?: string
  userId?: string
}

export default function Component ({ roleId, userId }: IProps) {
  const actionRef = useRef<any>()
  const [tableParams, setTableParams] = useState({})
  const [bizType, setBizType] = useState('0')
  const [rowKeys, setRowKeys] = useState<any>([])

  useEffect(() => {
    actionRef.current?.reload()
  }, [roleId, userId])

  const columns = [
    {
      key: 'title',
      dataIndex: 'title',
      title: '空间名称',
      filterDropdown: () => (
        <div style={{ padding: 8 }}>
          <Input.Search allowClear onSearch={e => setTableParams({ filterName: e })} />
        </div>
      ),
      filterIcon: filtered => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      render (text) {
        return (
          <>
            <FolderOutlined />
            &nbsp;
            {text}
          </>
        )
      },
    },
    {
      key: 'props',
      dataIndex: 'props',
      title: '功能权限',
      render (props, row) {
        return (
          <Space>
            {
              [{
                authType: '4',
                title: '使用',
                key: 'targetAuthUse',
              }, {
                authType: '5',
                title: '管理',
                key: 'targetAuthManage',
              }].map((item) => {
                if (!(item.authType < props.selfAuth)) return null
                return (
                  <AsyncCheckbox
                    key={row.id + (roleId || userId) + item.authType + props[item.key]}
                    value={props[item.key] === 'true'}
                    onRequest={async (value) => {
                      const params = {
                        authType: item.authType,
                        folderId: row.key,
                        roleId,
                        userId,
                      }
                      if (value) {
                        if (roleId) {
                          await addRoleBiGroupFolderAuth(params)
                        } else {
                          await addUserBiGroupFolderAuth(params)
                        }
                      } else {
                        if (roleId) {
                          await cancelRoleBiGroupFolderAuth(params)
                        } else {
                          await cancelUserBiGroupFolderAuth(params)
                        }
                      }
                      await actionRef.current?.reload()
                    }}
                    title={item.title}
                  />
                )
              })
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

  const onTabChange = (e) => {
    setBizType(e)
    actionRef.current?.reload()
  }

  return (
    <ProTable
      actionRef={actionRef}
      columns={columns}
      params={tableParams}
      headerTitle={(
        <Tabs onChange={onTabChange} activeKey={bizType}>
          <Tabs.TabPane key="0" tab="报表管理" />
          <Tabs.TabPane key="1" tab="数据接口" />
          <Tabs.TabPane key="2" tab="聚合接口" />
        </Tabs>
      )}
      request={async (params: any) => {
        const result = await (roleId ? getBiGroupTree : getUserBiGroupTree)({
          ...params,
          bizType,
          targetId: roleId || userId,
        })

        const fitleChildren = (arr) => {
          const ret = []
          arr.forEach((item) => {
            if (item.children && item.children.length) {
              item.children = fitleChildren(item.children)
            } else {
              delete item.children
            }
            ret.push({ ...item })
          })
          return ret
        }

        params.filterName && setRowKeys(flatChildren(result))

        return {
          success: true,
          data: fitleChildren(result),
        }
      }}
      expandable={{ expandedRowKeys: rowKeys, onExpandedRowsChange: setRowKeys }}
      pagination={false}
      options={false}
      search={false}
      rowKey="key"
    />
  )
}
