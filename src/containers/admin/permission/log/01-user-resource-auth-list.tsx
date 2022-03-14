import { useEffect, useRef, useState } from 'react'
import { Button, Modal, Table, message, Spin } from 'antd'
import ProTable from '@ant-design/pro-table'
import ProCard from '@ant-design/pro-card'
import useFetch from '@/hooks/useFetch'
import { getUserFullAuthListApi, getUserFullAuthDownloadApi, getUserColRowAuthApi, getManageAppApi } from '@/services/admin/permission-log'
import { statusMap, funcTypeMap, handleMap2Arr, resourceTypeMap } from './kv-map'

function Empty () {
  return (
    <div style={{
      display: 'flex',
      height: '100%',
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: 24,
      fontWeight: 'bold',
      color: '#666',
    }}
    >暂未配置</div>
  )
}

export default function UserResourceAuthList (): JSX.Element {
  const [{ data: manageAppData }, getManageApp]: any = useFetch(getManageAppApi)
  const [modal, setModal] = useState('')
  const [{
    data: userColRowAuth,
    loading: userColRowAuthLoading,
  }, getUserColRowAuth]: any = useFetch(getUserColRowAuthApi)
  const actionRef = useRef()
  const formRef: any = useRef()

  useEffect(() => {
    getManageApp()
  }, [])

  const columns = [
    {
      dataIndex: 'nickName',
      title: '用户花名',
      width: 72,
    },
    {
      dataIndex: 'deptName',
      title: '部门名称',
      width: 120,
      hideInSearch: true,
    },
    {
      dataIndex: 'positionName',
      title: '职位',
      width: 120,
      hideInSearch: true,
    },
    {
      dataIndex: 'status',
      title: '在职状态',
      width: 120,
      valueEnum: {
        ...statusMap,
      },
      valueType: 'select',
      fieldProps: {
        options: [
          {
            label: '全部',
            value: 'all',
          },
          ...handleMap2Arr(statusMap),
        ],
      },
    },
    {
      dataIndex: 'menuName',
      title: '资源所在菜单',
      width: 120,
      hideInSearch: true,
    },
    {
      dataIndex: 'relatedTargetId',
      title: '资源id',
      width: 120,
    },
    {
      dataIndex: 'relatedTargetName',
      title: '资源名称',
      width: 120,
      hideInSearch: true,
    },
    {
      dataIndex: 'resourceName',
      title: '资源名称',
      hideInTable: true,
    },
    {
      dataIndex: 'businessType',
      title: '资源类型',
      width: 120,
      hideInSearch: true,
    },
    {
      dataIndex: 'resourceBusinessType',
      title: '资源类型',
      valueType: 'select',
      fieldProps: {
        options: [
          {
            label: '全部',
            value: 'all',
          },
          ...handleMap2Arr(resourceTypeMap),
        ],
      },
      hideInTable: true,
    },
    {
      dataIndex: 'manageAppName',
      title: '应用端',
      width: 120,
      hideInSearch: true,
    },
    {
      dataIndex: 'manageAppId',
      title: '应用端',
      valueEnum: {
        all: { text: '全部' },
        ...manageAppData,
      },
      hideInTable: true,
    },
    {
      dataIndex: 'authTypes',
      title: '权限',
      width: 120,
      render (authTypes, row) {
        return authTypes.map((item, index) => {
          const title = funcTypeMap[item.authType]?.text
          const sign = authTypes.length - 1 !== index ? ', ' : ''
          if (item.haveRowColAuth) {
            return (
              <span>
                <span
                  style={{
                    color: '#1890ff',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    getUserColRowAuth({
                      userId: row.userId,
                      tableId: row.relatedTargetId,
                      authType: item.authType,
                    })
                    setModal('show')
                  }}
                >{title}</span>
                {sign}
              </span>
            )
          }
          return title + sign
        })
      },
      hideInSearch: true,
    },
  ]

  const handleSearchParams = ({ current, ...params }) => {
    const paramsData: any = {}
    Object.keys(params).forEach((key) => {
      if (params[key] !== 'all') {
        paramsData[key] = typeof params[key] === 'string' ? params[key].trim() : params[key]
      }
    })

    if (current) {
      paramsData.currentPage = current
    }

    if (params.resourceBusinessType && params.resourceBusinessType.indexOf('-') >= 0) {
      const [resourceBusinessType, menuResourceType] = params.resourceBusinessType.split('-')
      paramsData.resourceBusinessType = undefined
      paramsData.menuResourceType = menuResourceType
    }

    return paramsData
  }

  const onReportList = async () => {
    await getUserFullAuthDownloadApi(handleSearchParams(formRef.current?.getFieldsValue()))
    message.success('下载任务已添加，请稍后查看邮箱～')
  }

  return (
    <>
      <ProTable
        rowKey="id"
        toolBarRender={() => [
          <Button
            key="opt-import"
            type="primary"
            onClick={onReportList}
          >导出权限清单</Button>,
        ]}
        toolbar={{
          settings: [],
        }}
        actionRef={actionRef}
        formRef={formRef}
        columns={columns}
        request={async (params: any) => {
          const ret = await getUserFullAuthListApi(handleSearchParams(params))
          return {
            data: ret.list,
            total: ret.total,
            success: true,
          }
        }}
        search={{ labelWidth: 72 }}
        scroll={{ x: 'max-content' }}
      />
      <Modal
        width={800}
        destroyOnClose
        title="使用 — 行列权限条件规则"
        visible={modal === 'show'}
        onCancel={() => setModal('')}
        footer={null}
      >
        <Spin spinning={userColRowAuthLoading}>
          <ProCard split="vertical">
            <ProCard title="行权限条件规则" colSpan="50%">
              {
              userColRowAuth?.userRowAuth
                ? <div style={{ minHeight: 260 }}>
                  {userColRowAuth?.userRowAuth}
                </div>
                : <Empty />
            }
            </ProCard>
            <ProCard title="列权限条件规则">
              <div style={{ minHeight: 260 }}>
                <Table
                  dataSource={userColRowAuth?.userColumnAuth}
                  pagination={false}
                  columns={[
                    {
                      dataIndex: 'colName',
                      title: '字段',
                    },
                    {
                      dataIndex: 'colAlias',
                      title: '字段别名',
                    },
                  ]}
                  scroll={{
                    y: 360,
                  }}
                />
              </div>
            </ProCard>
          </ProCard>
        </Spin>
      </Modal>
    </>
  )
}
