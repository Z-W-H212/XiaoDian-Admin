import { useState, useRef, useEffect } from 'react'
import ProTable from '@ant-design/pro-table'
import { Input, Tabs } from 'antd'
import { SearchOutlined, FolderOutlined } from '@ant-design/icons'
import {
  getResourceBiGroupTree,
} from '@/services/admin/permission-resource'

import style from '../style.module.less'

interface IProps {
  resourceId: string
  onClickRow: (item: any) => void
  onChangeTab: () => void
}

export default function BiSpaceList ({ resourceId, onClickRow, onChangeTab }: IProps) {
  const actionRef = useRef<any>()
  const [tableParams, setTableParams] = useState({})
  const [bizType, setBizType] = useState('0')
  const [rowKeys, setRowKeys] = useState<any>([])

  useEffect(() => {
    actionRef.current?.reload()
  }, [])

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
  ]

  const onTabChange = (e) => {
    setBizType(e)
    actionRef.current?.reload()
    onChangeTab && onChangeTab()
  }

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
        const result = await getResourceBiGroupTree({
          ...params,
          bizType,
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
      rowClassName={(record) => {
        return record.key === resourceId ? style['split-row-select-active'] : ''
      }}
      onRow={(record) => {
        return {
          onClick () {
            if (record.key) {
              onClickRow(record)
            }
          },
        }
      }}
    />
  )
}
