import { useEffect, useRef, useState } from 'react'
import { Space, Input, Switch } from 'antd'
import ProTable, { ActionType } from '@ant-design/pro-table'
import { getResourceBiGroupRoleList, getResourceBiGroupUserList } from '@/services/admin/permission-resource'
import { addRoleBiGroupFolderAuth, cancelRoleBiGroupFolderAuth } from '@/services/admin/permission-role'
import { addUserBiGroupFolderAuth, cancelUserBiGroupFolderAuth } from '@/services/admin/permission-user'
import AsyncCheckbox from '@/components/async-checkbox'
import { SearchOutlined } from '@ant-design/icons'

interface IProps { // 每个文件夹当成一个资源
  resourceId: string // 当前选中的文件夹ID
  type?: 'user' | 'role'
  resource?: any // 当前选中的文件夹
}

const config = {
  role: {
    listAPI: getResourceBiGroupRoleList,
    key: 'roleName',
    title: '角色名称',
    addAuth: addRoleBiGroupFolderAuth,
    cancelAuth: cancelRoleBiGroupFolderAuth,
  },
  user: {
    listAPI: getResourceBiGroupUserList,
    key: 'nickName',
    title: '用户名称',
    addAuth: addUserBiGroupFolderAuth,
    cancelAuth: cancelUserBiGroupFolderAuth,
  },
}

export default function BISpaceRole ({ resourceId, type = 'role', resource }: IProps) {
  const actionRef = useRef<ActionType>()
  const [tableParams, setTableParams] = useState({})
  const [rowKeys, setRowKeys] = useState<any>([])
  const [onlyShowAuth, setOnlyShowAuth] = useState(false)
  const columns = [
    {
      key: config[type].key,
      dataIndex: config[type].key,
      title: config[type].title,
      filterDropdown: () => (
        <div style={{ padding: 8 }}>
          <Input.Search allowClear onSearch={e => setTableParams({ [config[type].key]: e })} />
        </div>
      ),
      filterIcon: filtered => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
    },
    {
      key: 'props',
      dataIndex: 'props',
      title: '功能权限',
      render (_, row) {
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
                if (!(item.authType < resource.props.selfAuth)) return null
                return (
                  <AsyncCheckbox
                    key={row.id + resourceId + item.authType + row[item.key]}
                    value={row[item.key] === 'true'}
                    onRequest={async (value) => {
                      const params: any = {
                        [`${type}Id`]: row.id,
                        authType: item.authType,
                        folderId: resourceId,
                      }
                      if (value) {
                        config[type].addAuth(params)
                      } else {
                        config[type].cancelAuth(params)
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

  useEffect(() => {
    resourceId && actionRef.current?.reload()
  }, [resourceId])

  if (!resourceId) return null

  return (
    <>
      <span
        style={{
          position: 'absolute',
          top: -36,
          right: 20,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        仅展示有权限的{{
        role: '角色',
        user: '用户',
      }[type]}&nbsp;
        <Switch
          checked={onlyShowAuth}
          onChange={(value) => {
            setOnlyShowAuth(value)
            actionRef.current?.reloadAndRest()
          }}
        />
      </span>
      <ProTable
        rowKey="id"
        options={false}
        search={false}
        actionRef={actionRef}
        columns={columns}
        params={tableParams}
        request={async (params) => {
          const result = await (config[type].listAPI)({
            groupId: resourceId,
            ...params,
            currentPage: params.current,
            onlyShowAuth,
          })

          setRowKeys(params[config[type].key] ? flatChildren(result.list) : [])

          return {
            data: result.list,
            success: true,
            total: Number(result.total),
          }
        }}
        expandable={{ expandedRowKeys: rowKeys, onExpandedRowsChange: setRowKeys }}
        scroll={{ x: 'max-content' }}
      />
    </>
  )
}
