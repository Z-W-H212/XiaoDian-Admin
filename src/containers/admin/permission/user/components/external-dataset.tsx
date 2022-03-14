import { useState, useRef, useEffect } from 'react'
import { message, Space, Input, Badge } from 'antd'
import ProTable, { ActionType } from '@ant-design/pro-table'
import AsyncCheckbox from '@/components/async-checkbox'
import { SearchOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import {
  addFolderUserAuth,
  cancelFolderUserAuth,
  addFileUserAuth,
  cancelFileUserAuth,
  getRowRule,
  postRowRule,
  getColRule,
  postColRule,
  getFolderTreeOnlyFolder,
  getFolderTreeFileList,
} from '@/services/admin/permission-user'

import { RowPermissionSelect } from '@/components/row-permission-select/index'
import { ColPermissionSelect } from '@/components/col-permission-select/index'
import { FilterBusinessDomain } from '@/components/filter-business-domain'

const layerMap = {
  folder: getFolderTreeOnlyFolder,
  file: getFolderTreeFileList,
}

export function ExternalDataset (props) {
  const { userId } = props
  const [tableParams, setTableParams] = useState<{ filterName?: string, businessDomainId?: string }>({})
  const [modalVisible, setModalVisible] = useState(null)
  const tableActionRef = useRef<ActionType>()
  const [layer, setLayer] = useState('folder') // 当前表格所处层级
  const [folderItem, setFolderItem] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const columns = [
    {
      key: 'title',
      dataIndex: 'title',
      title: layer === 'file'
        ? <a onClick={() => {
          setFolderItem(null)
          setLayer('folder')
          setTableParams({})
          tableActionRef.current?.reload()
        }}
        ><ArrowLeftOutlined /> 返回上一层 ({folderItem.title})</a>
        : '数据集名称',
      filterDropdown: () => (
        <div style={{ padding: 8 }}>
          <Input.Search
            allowClear onSearch={(e) => {
              setTableParams({ ...tableParams, filterName: e })
              setCurrentPage(1)
            }}
          />
        </div>
      ),
      filterIcon: filtered => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      render (text, row) {
        const content = <>{text} <div style={{ marginLeft: 40 }}>{row.props.tableAlias}</div></>
        return layer === 'file'
          ? content
          : <a onClick={() => {
            setFolderItem(row)
            setLayer('file')
            setCurrentPage(1)
            setTableParams({})
            tableActionRef.current?.reload()
          }}
          >{content}</a>
      },
    },
    {
      key: 'businessDomainName',
      dataIndex: ['props', 'businessDomainName'],
      title: '业务域',
      filterDropdown: layer === 'file'
        ? () =>
          <FilterBusinessDomain onSelected={(e) => {
            setTableParams({ ...tableParams, businessDomainId: e })
            setCurrentPage(1)
          }}
          />
        : null,
    },
    {
      key: 'func',
      dataIndex: 'func',
      title: '权限',
      render: (arr, row) => (
        <Space>
          {
            Array.isArray(arr) && arr.map(e => (
              <AsyncCheckbox
                key={e.key}
                value={e.permission}
                disabled={e.operateAble === false}
                popconfirm={row.type === 'node' ? {
                  title: '确定要基于数据库粒度赋权吗，操作后，将操作整个数据库下的所有数据集，请谨慎操作',
                } : null}
                onRequest={async (value) => {
                  const baseParams = {
                    authType: e.authType,
                    userId,
                  }
                  if (row.type === 'node') {
                    const params = {
                      ...baseParams,
                      folderId: row.key,
                    }
                    if (value) {
                      await addFolderUserAuth(params)
                    } else {
                      await cancelFolderUserAuth(params)
                    }
                  } else if (row.type === 'leaf') {
                    const params = {
                      ...baseParams,
                      fileId: row.key,
                      folderId: row.parentKey,
                    }
                    if (value) {
                      await addFileUserAuth(params)
                    } else {
                      await cancelFileUserAuth(params)
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
    {
      key: 'permit',
      dataIndex: 'columnConfig',
      title: '授权范围',
      render (_, row) {
        if (row.rowConfig === null && row.columnConfig === null) {
          return null
        }
        const params = {
          fileId: row.key,
          dbName: row.props.dsName,
          tableName: row.props.tableName,
        }
        return (
          <Space>
            <Badge dot={row.rowConfig}>
              <a
                href="#"
                onClick={() => setModalVisible({
                  modal: 'ROW_MODAL',
                  params,
                })}
              >行权限</a>
            </Badge>
            <Badge dot={row.columnConfig}>
              <a href="#" onClick={() => setModalVisible({ modal: 'COL_MODAL', params })}>列权限</a>
            </Badge>
          </Space>
        )
      },
    },
  ]

  useEffect(() => {
    setLayer('folder')
    tableActionRef.current?.reload()
  }, [userId])

  return (
    <>
      <ProTable
        rowKey="key"
        options={false}
        actionRef={tableActionRef}
        columns={columns}
        pagination={layer === 'file' ? { pageSize: 20, current: currentPage } : false}
        params={tableParams}
        request={async (params: any, sorter, filter) => {
          const { current, ...otherParams } = params
          const result = await layerMap[layer]({
            ...otherParams,
            currentPage: current,
            userId,
            folderId: layer === 'file' && folderItem.key,
          })

          layer === 'file' && setCurrentPage(current)

          return {
            success: true,
            total: layer === 'file' ? result.total : undefined,
            data: (layer === 'file' ? result.list : result).map((item) => {
              item.children = null
              return item
            }),
          }
        }}
        search={false}
        scroll={{ x: 'max-content' }}
      />
      {
        modalVisible?.modal === 'ROW_MODAL' && (
          <RowPermissionSelect
            visible
            params={modalVisible?.params}
            onRequest={async (params) => {
              return {
                data: await getRowRule({ userId, schemaTableId: params.fileId }),
              }
            }}
            onOk={async (raw, params) => {
              try {
                await postRowRule({
                  userId,
                  rule: raw,
                  schemaTableId: params.fileId,
                })
                setModalVisible(null)
                await tableActionRef.current?.reload()
                message.success('保存成功')
              } catch (err) {
                message.error('保存失败')
              }
            }}
            onCancel={() => setModalVisible(null)}
          />
        )
      }

      {
        modalVisible?.modal === 'COL_MODAL' && (
          <ColPermissionSelect
            visible
            params={modalVisible?.params}
            onRequest={async (params) => {
              const result = await getColRule({ userId, schemaTableId: params.fileId })
              return {
                data: result.map(e => ({
                  id: e.columnId,
                  alias: e.columnAlias,
                  name: e.columnName,
                  checked: e.permission,
                })),
              }
            }}
            onOk={async (selectedkeys, params) => {
              try {
                await postColRule({
                  userId,
                  schemaTableColumnIds: selectedkeys,
                  schemaTableId: params.fileId,
                })
                message.success('保存成功')
                setModalVisible(null)
                await tableActionRef.current?.reload()
              } catch (err) {
                message.error('保存失败')
              }
            }}
            onCancel={() => setModalVisible(null)}
          />
        )
      }
    </>
  )
}
