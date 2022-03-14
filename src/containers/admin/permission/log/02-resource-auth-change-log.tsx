import { useEffect, useRef, useState } from 'react'
import { Button, Modal, Table, Empty, message } from 'antd'
import moment from 'moment'
import ProCard from '@ant-design/pro-card'
import ProTable from '@ant-design/pro-table'
import useFetch from '@/hooks/useFetch'
import { getResourceAuthListApi, getResourceAuthDownloadApi, getManageAppApi } from '@/services/admin/permission-log'
import { optTypeMap, targetTypeMap, resourceTypeMap, funcTypeMap, changeTypeMap, handleMap2Arr } from './kv-map'
type modal = {
  type: string;
  activeItem?: any;
}

export default function ResourceAuthChangeLog (): JSX.Element {
  const [{ data: manageAppData }, getManageApp]: any = useFetch(getManageAppApi)
  const [modal, setModal] = useState<modal>({
    type: '',
    activeItem: {},
  })
  const actionRef = useRef()
  const formRef: any = useRef()

  useEffect(() => {
    getManageApp()
  }, [])

  const columns = [
    {
      dataIndex: 'resourceId',
      title: '资源id',
      width: 120,
    },
    {
      dataIndex: 'resourceName',
      title: '资源名称',
      width: 120,
      render (text, row) {
        if (text !== row.resourceNowName && row.resourceNowName) {
          return (
            <div>
              <div>{text}</div>
              <div style={{
                fontSize: 12,
                color: 'red',
              }}
              >(现用名:{row.resourceNowName})</div>
            </div>
          )
        }
        return text
      },
    },
    {
      dataIndex: 'resourceType',
      title: '资源类型',
      width: 120,
      render (_, row) {
        if (row.resourceBusinessType !== 4) {
          return resourceTypeMap[row.resourceBusinessType]
        }
        return resourceTypeMap[`${row.resourceBusinessType}-${row.menuResourceType}`]
      },
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
      dataIndex: 'resourceParentName',
      title: '资源所在菜单',
      width: 120,
      hideInSearch: true,
    },
    {
      dataIndex: 'appName',
      title: '应用端',
      width: 120,
      render: (text, row) => (row.resourceBusinessType === 2 ? resourceTypeMap[row.resourceBusinessType] : text),
      hideInSearch: true,
    },
    {
      dataIndex: 'appId',
      title: '应用端',
      valueEnum: {
        all: { text: '全部' },
        ...manageAppData,
      },
      hideInTable: true,
    },
    {
      dataIndex: 'changeType',
      title: '变更方式',
      width: 120,
      hideInSearch: true,
      valueEnum: {
        ...changeTypeMap,
      },
    },
    {
      dataIndex: 'optType',
      title: '操作类型',
      width: 120,
      valueEnum: {
        all: { text: '全部' },
        ...optTypeMap,
      },
    },
    {
      dataIndex: 'content',
      title: '操作内容',
      width: 120,
      render (_, row) {
        if (row.columnAuthContent) {
          return (
            <a onClick={() => {
              const dataSource = []
              row.columnAuthContent?.canceledColumn.forEach((item) => {
                dataSource.push({
                  ...item,
                  type: 'canceled',
                })
              })
              row.columnAuthContent?.addColumn.forEach((item) => {
                dataSource.push({
                  ...item,
                  type: 'add',
                })
              })
              setModal({
                type: 'col',
                activeItem: {
                  ...row,
                  dataSource,
                },
              })
            }}
            >列权限</a>
          )
        } else if (row.rowAuthContent) {
          return (
            <a onClick={() => {
              setModal({
                type: 'row',
                activeItem: row,
              })
            }}
            >行权限</a>
          )
        }
        return funcTypeMap[row.functionAuthContent]?.text
      },
      hideInSearch: true,
    },
    {
      dataIndex: 'targetName',
      title: '影响对象',
      width: 120,
    },
    {
      dataIndex: 'targetType',
      title: '影响对象类型',
      width: 120,
      valueEnum: {
        all: { text: '全部' },
        ...targetTypeMap,
      },
    },
    {
      dataIndex: 'targetDeptName',
      title: '对象所属部门',
      width: 120,
      hideInSearch: true,
    },
    {
      dataIndex: 'operatorNickname',
      title: '操作人',
      width: 120,
      hideInSearch: true,
    },
    {
      dataIndex: 'operator',
      title: '操作人',
      hideInTable: true,
    },
    {
      dataIndex: 'operatorDeptName',
      title: '操作人所属部门',
      width: 120,
      hideInSearch: true,
    },
    {
      dataIndex: 'operateTime',
      title: '操作时间',
      width: 120,
      hideInSearch: true,
    },
    {
      dataIndex: 'operateDateRange',
      title: '操作时间',
      valueType: 'dateRange',
      initialValue: [moment().add(-7, 'days')
        .format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')],
      hideInTable: true,
    },
  ]

  const handleSearchParams = ({ current, operateDateRange, ...params }) => {
    const paramsData: any = {}
    Object.keys(params).forEach((key) => {
      if (params[key] !== 'all') {
        paramsData[key] = typeof params[key] === 'string' ? params[key].trim() : params[key]
      }
    })

    if (operateDateRange && Array.isArray(operateDateRange)) {
      const [start, end] = operateDateRange
      if (start && typeof start === 'string') {
        paramsData.operateBeginTime = +new Date(`${start.replace(/-/g, '/')} 00:00`)
      }
      if (end && typeof end === 'string') {
        paramsData.operateEndTime = +new Date(`${end.replace(/-/g, '/')} 23:59`)
      }
    }

    if (params.resourceBusinessType && params.resourceBusinessType.indexOf('-') >= 0) {
      const [resourceBusinessType, menuResourceType] = params.resourceBusinessType.split('-')
      paramsData.resourceBusinessType = undefined
      paramsData.menuResourceType = menuResourceType
    }

    if (current) {
      paramsData.currentPage = current
    }

    return paramsData
  }

  const onReportList = async () => {
    await getResourceAuthDownloadApi(handleSearchParams(formRef.current?.getFieldsValue()))
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
          >导出日志清单</Button>,
        ]}
        toolbar={{
          settings: [],
        }}
        actionRef={actionRef}
        formRef={formRef}
        columns={columns}
        request={async (params: any) => {
          const ret = await getResourceAuthListApi(handleSearchParams(params))
          return {
            data: ret.list,
            total: ret.total,
            success: true,
          }
        }}
        search={{ labelWidth: 92 }}
        scroll={{ x: 'max-content' }}
      />
      <Modal
        width={700}
        destroyOnClose
        title="行权限条件规则变更记录"
        visible={modal.type === 'row'}
        onCancel={() => setModal({ type: '' })}
        footer={null}
      >
        <ProCard gutter={16} split="vertical">
          <ProCard title="变更前条件规则" type="inner" bordered>
            {modal.activeItem?.rowAuthContent?.oldRule || <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </ProCard>
          <ProCard title="变更后条件规则" type="inner" bordered>
            {modal.activeItem?.rowAuthContent?.newRule || <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </ProCard>
        </ProCard>
      </Modal>
      <Modal
        destroyOnClose
        title="列权限变更记录"
        visible={modal.type === 'col'}
        onCancel={() => setModal({ type: '' })}
        footer={null}
      >
        <Table
          dataSource={modal.activeItem?.dataSource}
          columns={[
            {
              dataIndex: 'columnName',
              title: '字段',
              render: (text, row) => ({
                canceled: <span style={{ textDecoration: 'line-through' }}>{text}</span>,
                add: text,
              }[row.type]),
            },
            {
              dataIndex: 'columnAlias',
              title: '字段别名',
              render: (text, row) => ({
                canceled: <span style={{ textDecoration: 'line-through' }}>{text}</span>,
                add: text,
              }[row.type]),
            },
            {
              dataIndex: 'type',
              title: '变更',
              render: text => ({
                canceled: <span style={{ color: 'red' }}>取消赋权</span>,
                add: <span style={{ color: 'green' }}>赋权</span>,
              }[text]),
            },
          ]}
        />
      </Modal>
    </>
  )
}
