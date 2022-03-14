import { useEffect, useRef, useState, useMemo } from 'react'
import ProTable, { ActionType } from '@ant-design/pro-table'
import { Input } from 'antd'
import { SearchOutlined, RightOutlined } from '@ant-design/icons'
import { getResourceDatasetList, getResourceDatasetMenu } from '@/services/admin/permission-resource'
import style from '../style.module.less'
import { FilterBusinessDomain } from '@/components/filter-business-domain'
interface Props {
  folderId: string
  fileId: string
  onClickRow (fileId: string, props?: { tableName: string, dsName: string }): void
  onDrill (folderId: string): void
  onGoback (): void
}

type TableParams = {
  current?: number
  schemaTableName?: string
  businessDomainId?: string
  folderId?: string
}

export function DatasetList (props: Props) {
  const { folderId, fileId, onDrill, onGoback, onClickRow } = props
  const actionRef = useRef<ActionType>()
  const [tableParams, setTableParams] = useState<TableParams>({})

  useEffect(() => {
    setTableParams((state) => {
      const { current, ...arg } = state
      return { ...arg, folderId }
    })
  }, [folderId])

  const handlerGoback = () => {
    const params = { ...tableParams }
    delete params.folderId
    delete params.schemaTableName
    delete params.businessDomainId
    setTableParams(params)
    onGoback()
  }

  const columns = useMemo(() => {
    const list: any[] = [
      {
        key: 'title',
        dataIndex: 'title',
        title: '数据集名称',
        filterDropdown: folderId
          ? () => (
            <div style={{ padding: 8 }}>
              <Input.Search
                allowClear
                onSearch={e => setTableParams({ ...tableParams, schemaTableName: e })}
              />
            </div>
          )
          : undefined,
        filterIcon: folderId
          ? filtered => (
            <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
          )
          : undefined,
        render: (text, row) => (
          <>{text} <div>{row.props.tableAlias}</div></>
        ),
      },
      {
        key: 'businessDomainName',
        dataIndex: ['props', 'businessDomainName'],
        title: '业务域',
        filterDropdown: folderId
          ? () => {
            return <FilterBusinessDomain onSelected={e => setTableParams({ ...tableParams, businessDomainId: e })} />
          }
          : undefined
        ,
      },
    ]
    if (!folderId) {
      list.push({
        key: 'other',
        dataIndex: 'other',
        title: '',
        render (text, row) {
          return (
            <div
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDrill(row.key)
              }}
            >
              <RightOutlined className={style.anchorIcon} />
            </div>
          )
        },
      })
    } else {
      list.push({
        key: 'other',
        dataIndex: 'other',
        title: <div className={style.anchorIcon} onClick={handlerGoback}>返回上级</div>,
      })
    }
    return list
  }, [folderId, tableParams])

  return (
    <ProTable
      key={folderId}
      rowKey="key"
      actionRef={actionRef}
      options={false}
      search={false}
      columns={columns}
      params={tableParams}
      request={async (params) => {
        let data
        let total
        const { folderId, ...arg } = tableParams
        if (folderId) {
          data = await getResourceDatasetList({
            ...arg,
            folderId,
            currentPage: params.current,
            pageSize: params.pageSize,
          })
          total = data.total
          data = data.list
        } else {
          data = await getResourceDatasetMenu(params)
          total = data.length
        }
        return {
          data: data.map(e => ({ ...e, children: null })),
          total,
          success: true,
        }
      }}
      rowClassName={(record) => {
        return record.key === fileId ? style['split-row-select-active'] : ''
      }}
      onRow={(record) => {
        return {
          onClick () {
            if (record.key) {
              onClickRow(record.key, {
                tableName: record.props.tableName,
                dsName: record.props.dsName,
              })
            }
          },
        }
      }}
      scroll={{ x: 'max-content' }}
    />
  )
}
