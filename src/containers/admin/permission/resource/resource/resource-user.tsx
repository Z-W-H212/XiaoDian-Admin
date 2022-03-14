
import { useEffect, useRef, useState } from 'react'
import { Space, Input, Switch } from 'antd'
import ProTable, { ActionType } from '@ant-design/pro-table'
import { getResourceUserList } from '@/services/admin/permission-resource'
import { setUserMenuEnable, setUserMenuDisable } from '@/services/admin/permission-user'
import AsyncCheckbox from '@/components/async-checkbox'
import { SearchOutlined } from '@ant-design/icons'

export function ResouceUser (props) {
  const { menuId, resourceId } = props
  const actionRef = useRef<ActionType>()
  const [tableParams, setTableParams] = useState({})
  const [onlyShowAuth, setOnlyShowAuth] = useState(false)
  const columns = [
    {
      key: 'nickName',
      dataIndex: 'nickName',
      title: '用户名称',
      filterDropdown: () => (
        <div style={{ padding: 8 }}>
          <Input.Search allowClear onSearch={e => setTableParams({ nickName: e })} />
        </div>
      ),
      filterIcon: filtered => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
    },
    {
      key: 'func',
      dataIndex: 'func',
      title: '功能权限',
      render: (arr, row) => (
        <Space>
          {
            arr.map(e => (
              <AsyncCheckbox
                key={e.key}
                value={e.permission}
                disabled={e.operateAble === false}
                onRequest={async (value) => {
                  const params = {
                    authType: e.authType,
                    menuId,
                    resourceId,
                    targetUserId: row.id,
                  }
                  if (value) {
                    await setUserMenuEnable(params)
                  } else {
                    await setUserMenuDisable(params)
                  }
                  await actionRef.current?.reload()
                }}
                title={e.title}
              />
            ))
          }
        </Space>
      ),
    },
  ]

  useEffect(() => {
    actionRef.current?.reload()
  }, [menuId, resourceId])

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
        仅展示有权限的用户&nbsp;
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
        request={async (params, sorter, filter) => {
          const result = await getResourceUserList({
            menuId,
            resourceId,
            ...params,
            currentPage: params.current,
            onlyShowAuth,
          })
          return {
            data: result.list,
            success: true,
            total: Number(result.total),
          }
        }}
        scroll={{ x: 'max-content' }}
      />
    </>
  )
}
