import { useRef } from 'react'
import { Button, message } from 'antd'
import moment from 'moment'
import ProTable from '@ant-design/pro-table'
import { dataAuthChangeListApi, dataAuthChangeDownloadApi } from '@/services/admin/permission-log'
import { dataAuthTypeMap } from './kv-map'

export default function DataAuthChangeLog (): JSX.Element {
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
      dataIndex: 'dataAuthType',
      title: '数据权限类型',
      width: 120,
      valueEnum: {
        all: { text: '全部' },
        ...dataAuthTypeMap,
      },
    },
    {
      dataIndex: 'ContentDTO',
      title: '变更内容',
      width: 120,
      render (_, row) {
        const ret = []
        // 城市  cityName-ownerName
        if (row.dataAuthType === 'city_permission' && row.cityPermissionContentDTO) {
          const addCity = row.cityPermissionContentDTO.addCity?.map(item => item.cityName + (item.ownerName ? `-${item.ownerName}` : '')) || []
          const deleteCity = row.cityPermissionContentDTO.deleteCity?.map(item => item.cityName + (item.ownerName ? `-${item.ownerName}` : '')) || []
          if (addCity.length) {
            ret.push(`增加: ${addCity.join(', ')}`)
          }
          if (deleteCity.length) {
            ret.push(`删除: ${deleteCity.join(', ')}`)
          }
        // 组织架构 nickName
        } else if (row.dataAuthType === 'organization' && row.dataAuthContentDTO) {
          const add = row.dataAuthContentDTO.add?.map(item => item.nickName) || []
          const deleteList = row.dataAuthContentDTO.delete?.map(item => item.nickName) || []
          if (add.length) {
            ret.push(`增加: ${add.join(', ')}`)
          }
          if (deleteList.length) {
            ret.push(`删除: ${deleteList.join(', ')}`)
          }
        }
        return ret.join('; ')
      },
      hideInSearch: true,
    },
    {
      dataIndex: 'AfterChange',
      title: '变更后数据权限',
      width: 120,
      render (_, row) {
        const ret = []
        // 城市  cityName-ownerName
        if (row.dataAuthType === 'city_permission' && row.cityPermissionAfterChange) {
          const cityPermission = row.cityPermissionAfterChange.cityPermission?.map(item => item.cityName + (item.ownerName ? `-${item.ownerName}` : '')) || []
          if (cityPermission.length) {
            ret.push(cityPermission.join(', '))
          }
        // 组织架构 nickName
        } else if (row.dataAuthType === 'organization' && row.dataAuthAfterChange) {
          const dataAuthAfterChange = row.dataAuthAfterChange?.map(item => item.nickName) || []
          if (dataAuthAfterChange.length) {
            ret.push(dataAuthAfterChange.join(', '))
          }
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
      dataIndex: 'operatorName',
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
    await dataAuthChangeDownloadApi(handleSearchParams(formRef.current?.getFieldsValue()))
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
          const ret = await dataAuthChangeListApi(handleSearchParams(params))
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
