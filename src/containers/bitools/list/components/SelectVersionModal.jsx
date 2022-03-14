import { useState, useRef } from 'react'
import ProTable from '@ant-design/pro-table'
import moment from 'moment'
import BaseModal from './BaseModal'
import style from './style.module.less'
import {
  reportVersions,
} from '@/services/reportService'
import { Alert, Tag } from 'antd'

// 选择版本
const SelectVersionModal = ({
  values,
  onChange,
  onSubmit,
  shotTip,
  ...otherProps
}) => {
  const { id } = values
  const [selectedRow, setSelectedRow] = useState(null)
  const actionRef = useRef()
  const columns = [
    {
      key: 'versionCode',
      dataIndex: 'versionCode',
      title: '版本号',
      render (value, row) {
        return (
          <span style={{ fontSize: '10px' }}>
            {value}
            <span style={{ marginLeft: 8 }}>
              {typeof row.tag === 'string' &&
                row.tag &&
                row.tag.split(';').map(v => <Tag color="red" key={v}>{v}</Tag>)}
            </span>
          </span>
        )
      },
    },
    {
      key: 'reportId',
      dataIndex: 'reportId',
      title: 'ID',
      width: 120,
      render (value, row) {
        return <span style={{ fontSize: '10px' }}>{value}</span>
      },
    },
    {
      key: 'versionStatus',
      dataIndex: 'versionStatus',
      title: '版本状态',
      valueEnum: {
        all: { text: '全部' },
        0: { text: '保存未发布', status: 'Processing' },
        1: { text: '已发布', status: 'Success' },
        2: { text: '已下线', status: 'Default' },
        3: { text: '已归档', status: 'Default' },
      },
      render (value, row) {
        return <span style={{ fontSize: '10px' }}>{value}</span>
      },
    },
    {
      key: 'commitUser',
      dataIndex: 'commitUser',
      title: '提交人',
      render: (text, record) => (
        <div className={style.reportTableTinyCell}>
          <b>{text}</b>
          {moment(Number(record.commitDatetime)).format('YYYY-MM-DD HH:mm:ss')}
        </div>
      ),
    },
    {
      key: 'versionComment',
      dataIndex: 'versionComment',
      title: '版本备注',
      width: 200,
      render (value, row) {
        return <span style={{ fontSize: '10px' }}>{value}</span>
      },
    },
  ]

  const rowSelection = {
    type: 'radio',
    selectedRowKeys: [selectedRow?.id],
    onChange (_, rows) {
      setSelectedRow(rows[0])
    },
  }

  return (
    <BaseModal
      {...otherProps}
      width={800}
      onSubmit={() => {
        onSubmit({ ...values, ...selectedRow })
      }}
    >
      {(shotTip &&
        selectedRow?.versionStatus === 0) &&
          <Alert
            style={{ marginBottom: '8px' }}
            message="编辑完成后，新的记录将覆盖当前“保存未发布”的版本"
            type="warning"
            showIcon
          />}
      <ProTable
        actionRef={actionRef}
        tableAlertRender={false}
        tableAlertOptionRender={false}
        rowSelection={rowSelection}
        rowKey="id"
        toolBarRender={false}
        search={false}
        columns={columns}
        request={async () => {
          const result = await reportVersions({ id })
          if (result.success && result.data.length > 0) {
            setSelectedRow(result.data[0])
          }
          return result
        }}
      />
    </BaseModal>
  )
}

export default SelectVersionModal
