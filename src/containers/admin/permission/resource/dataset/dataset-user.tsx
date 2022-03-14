import { useEffect, useRef, useState } from 'react'
import { Space, Input, Badge, message, Switch } from 'antd'
import ProTable, { ActionType } from '@ant-design/pro-table'
import { getResourceUserFileList } from '@/services/admin/permission-resource'
import AsyncCheckbox from '@/components/async-checkbox'
import { SearchOutlined } from '@ant-design/icons'
import {
  addFileUserAuth,
  cancelFileUserAuth,
  getRowRule,
  postRowRule,
  getColRule,
  postColRule,
} from '@/services/admin/permission-user'
import { RowPermissionSelect } from '@/components/row-permission-select/index'
import { ColPermissionSelect } from '@/components/col-permission-select/index'

interface Params {
  userId: string
  fileId: string
  dbName: string
  tableName: string
}

enum ModalType {
  NONE = 'NONE',
  COL_MODAL = 'COL_MODAL',
  ROW_MODAL = 'ROW_MODAL',
}

interface Props {
  folderId: string
  fileId: string
  params: {
    dsName: string
    tableName: string
  }
}

export function DatasetUser (props: Props) {
  const { folderId, fileId } = props
  const actionRef = useRef<ActionType>()
  const [tableParams, setTableParams] = useState({})
  const [modalVisible, setModalVisible] = useState<{ modal: ModalType, params?: Params }>({ modal: ModalType.NONE })
  const [onlyShowAuth, setOnlyShowAuth] = useState(false)
  const columns = [
    {
      key: 'nickName',
      dataIndex: 'nickName',
      title: '用户名称',
      filterDropdown: () => (
        <div style={{ padding: 8 }}>
          <Input.Search allowClear onSearch={e => setTableParams({ userName: e })} />
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
                popconfirm={folderId === fileId
                  ? {
                    title: '确定要基于数据库粒度赋权吗，操作后，将操作整个数据库下的所有数据集，请谨慎操作',
                  }
                  : null}
                onRequest={async (value) => {
                  const params = {
                    authType: e.authType,
                    fileId,
                    folderId,
                    userId: row.id,
                  }
                  if (value) {
                    await addFileUserAuth(params)
                  } else {
                    await cancelFileUserAuth(params)
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
    {
      key: 'permit',
      dataIndex: 'columnConfig',
      title: '授权范围',
      render (_, row) {
        if (row.rowConfig === null && row.columnConfig === null) {
          return null
        }

        const params = {
          userId: row.id,
          fileId,
          dbName: props.params.dsName,
          tableName: props.params.tableName,
        }

        return (
          <Space>
            <Badge dot={row.rowConfig}>
              <a
                href="#"
                onClick={() => setModalVisible({
                  modal: ModalType.ROW_MODAL,
                  params,
                })}
              >行权限</a>
            </Badge>
            <Badge dot={row.columnConfig}>
              <a
                href="#"
                onClick={() => setModalVisible({
                  modal: ModalType.COL_MODAL,
                  params,
                })}
              >列权限</a>
            </Badge>
          </Space>
        )
      },
    },
  ]

  useEffect(() => {
    actionRef.current?.reload()
  }, [folderId, fileId])

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
        request={async (params: any) => {
          const result = await getResourceUserFileList({
            ...params,
            currentPage: params.current,
            folderId,
            fileId,
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
      {
        modalVisible.modal === ModalType.ROW_MODAL && (
          <RowPermissionSelect
            visible
            params={modalVisible?.params}
            onRequest={async (params) => {
              return {
                data: await getRowRule({ userId: params.userId, schemaTableId: params.fileId }),
              }
            }}
            onOk={async (raw, params) => {
              try {
                await postRowRule({
                  userId: params.userId,
                  rule: raw,
                  schemaTableId: params.fileId,
                })
                setModalVisible({ modal: ModalType.NONE })
                actionRef.current?.reload()
                message.success('保存成功')
              } catch (err) {
                message.error('保存失败')
              }
            }}
            onCancel={() => setModalVisible({ modal: ModalType.NONE })}
          />
        )
      }

      {
        modalVisible.modal === ModalType.COL_MODAL && (
          <ColPermissionSelect
            visible
            params={modalVisible?.params}
            onRequest={async (params) => {
              const result = await getColRule({ userId: params.userId, schemaTableId: params.fileId })
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
                  userId: params.userId,
                  schemaTableColumnIds: selectedkeys,
                  schemaTableId: params.fileId,
                })
                setModalVisible({ modal: ModalType.NONE })
                actionRef.current?.reload()
                message.success('保存成功')
              } catch (err) {
                message.error('保存失败')
              }
            }}
            onCancel={() => setModalVisible({ modal: ModalType.NONE })}
          />
        )
      }
    </>
  )
}
