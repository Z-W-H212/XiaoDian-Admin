import { useRef } from 'react'
import { Button, message } from 'antd'
import moment from 'moment'
import ProTable from '@ant-design/pro-table'
import { getRoleChangeListApi, getRoleChangeDownloadApi } from '@/services/admin/permission-log'
import { roleSourceMap } from './kv-map'

export default function UserRoleChangeLog (): JSX.Element {
  const actionRef = useRef()
  const formRef: any = useRef()

  const columns = [
    {
      dataIndex: 'userNickname',
      title: '用户花名',
      width: 120,
    },
    {
      dataIndex: 'userDeptName',
      title: '部门',
      width: 120,
      hideInSearch: true,
    },
    {
      dataIndex: 'deptId',
      title: '部门',
      width: 120,
      hideInTable: true,
      valueType: 'search-dept',
    },
    {
      dataIndex: 'roleSource',
      title: '变更类型',
      width: 120,
      valueEnum: {
        all: { text: '全部' },
        ...roleSourceMap,
      },
    },
    {
      dataIndex: 'content',
      title: '变更内容',
      width: 120,
      render (content) {
        if (!content) return '-'
        const ret = []
        const addRoleAggs = content?.addRoleAggs?.map(item => item.roleName) || []
        const deleteRoleAggs = content?.deleteRoleAggs?.map(item => item.roleName) || []
        if (addRoleAggs.length) {
          ret.push(`新增: ${addRoleAggs.join(',')}`)
        }
        if (deleteRoleAggs.length) {
          ret.push(`删除: ${deleteRoleAggs.join(',')}`)
        }
        return ret.join('; ')
      },
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
    if (current) {
      paramsData.currentPage = current
    }
    return paramsData
  }

  const onReportList = async () => {
    await getRoleChangeDownloadApi(handleSearchParams(formRef.current?.getFieldsValue()))
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
          const ret = await getRoleChangeListApi(handleSearchParams(params))
          return {
            data: ret.list,
            total: ret.total,
            success: true,
          }
        }}
        search={{ labelWidth: 92 }}
        scroll={{ x: 'max-content' }}
      />
    </>
  )
}
