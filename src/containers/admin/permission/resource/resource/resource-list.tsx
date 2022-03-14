import { useEffect, useRef, useState } from 'react'
import ProTable, { ActionType } from '@ant-design/pro-table'
import { Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { getResourceList } from '@/services/admin/permission-resource'
import style from '../style.module.less'

export function ResourceList (props) {
  const { menuId, resourceId, onClickRow } = props
  const actionRef = useRef<ActionType>()
  const [tableParams, setTableParams] = useState({})
  const columns = [
    {
      key: 'resourceName',
      dataIndex: 'resourceName',
      title: '资源名称',
      filterDropdown: () => (
        <div style={{ padding: 8 }}>
          <Input.Search allowClear onSearch={e => setTableParams({ resourceName: e })} />
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
  ]

  useEffect(() => {
    actionRef.current?.reload()
    onClickRow(null)
  }, [menuId])

  return (
    <ProTable
      rowKey="id"
      actionRef={actionRef}
      options={false}
      search={false}
      columns={columns}
      params={tableParams}
      headerTitle="资源列表"
      request={async (params, sorter, filter) => {
        const result = await getResourceList({
          menuId,
          ...params,
          currentPage: params.current,
        })
        return {
          data: result.list,
          success: true,
          total: Number(result.total),
        }
      }}
      rowClassName={(record) => {
        return record.id === resourceId ? style['split-row-select-active'] : ''
      }}
      onRow={(record) => {
        return {
          onClick () {
            if (record.id) {
              onClickRow(record.id)
            }
          },
        }
      }}
      scroll={{ x: 'max-content' }}
    />
  )
}
