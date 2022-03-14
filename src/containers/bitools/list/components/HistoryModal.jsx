import { useRef, useState, useEffect } from 'react'
import ProTable from '@ant-design/pro-table'
import { Link } from 'react-router-dom'
import moment from 'moment'
import BaseModal from './BaseModal'
import style from './style.module.less'
import {
  publishReport,
  offlineReport,
  reportVersions,
  delReport,
  rollbackReport,
  duplicateCheck,
  duplicateNewCheck,
} from '@/services/reportService'
import { message, Form, Input, Tag } from 'antd'

// 版本记录
const HistoryModal = ({
  values,
  onChange,
  onSubmit,
  ...otherProps
}) => {
  const { id, mode } = values
  const actionRef = useRef()
  const modalFormRef = useRef()
  const [modalData, setModalData] = useState({
    type: '', // rollback | publish
    params: {},
  })
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
          <b>
            {text}
          </b>
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

  columns.push({
    title: '操作',
    valueType: 'option',
    // width: 200,
    align: 'center',
    render (_, record) {
      const { reportId, versionCode } = record
      const buttons = []
      buttons.push(<Link to={`/bi/createReport?mode=${mode === 0 ? 'GRAPH' : 'DSL'}&id=${reportId}&versionCode=${versionCode}&ro=1`}>查看详情</Link>)

      if (record.versionStatus === 0) { // 保存未发布可以发布
        buttons.push(<a
          onClick={async () => {
            setModalData({
              type: 'publish',
              params: {
                reportId: record.reportId,
              },
            })
          }}
        >发布</a>)
      } else if (record.versionStatus === 1) { // 已发布可以下线
        buttons.push(<a
          onClick={async () => {
            const success = await offlineReport({ id: reportId })
            if (success) {
              message.success('下线成功')
              actionRef.current.reload()
              onChange()
            }
          }}
        >下线</a>)
      } else if (record.versionStatus === 2) { // 已下线可以回滚
        buttons.push(<a
          onClick={async () => {
            const duplicateCheckData = await duplicateCheck({ reportId, versionCode })
            setModalData({
              type: 'rollback',
              params: {
                versionRefId: duplicateCheckData.versionRefId,
                nameDuplicate: duplicateCheckData.nameDuplicate,
                codeDuplicate: duplicateCheckData.codeDuplicate,
                reportId: record.reportId,
                versionCode: record.versionCode,
              },
            })
          }}
        >回滚</a>)
      }

      buttons.push(<a
        disabled={record.versionStatus !== 0} // 保存未发布不禁用删除
        onClick={async () => {
          await delReport({ id: reportId, versionCode })
          message.success('删除成功')
          actionRef.current.reload()
          onChange()
        }}
      >删除</a>)
      return buttons
    },
  })

  useEffect(() => {
    modalFormRef.current?.resetFields()
  }, [modalData])

  return (
    <BaseModal
      {...otherProps}
      width={1000}
      onSubmit={() => onSubmit()}
    >
      <ProTable
        actionRef={actionRef}
        tableAlertRender={false}
        tableAlertOptionRender={false}
        rowKey="id"
        toolBarRender={false}
        search={false}
        columns={columns}
        request={async () => await reportVersions({ id })}
      />
      <BaseModal
        formRef={modalFormRef}
        width={500}
        visible={!!modalData.type}
        title={{
          rollback: '回滚',
          publish: '发布',
        }[modalData.type]}
        onCancel={() => setModalData({ type: '', params: {} })}
        onSubmit={async ({ name, code, versionComment }) => {
          switch (modalData.type) {
            case 'rollback': {
              const success = await rollbackReport({
                reportId: modalData.params.reportId,
                versionId: modalData.params.versionCode,
                newCode: code,
                newName: name,
                versionComment,
              })
              if (success) {
                message.success('回滚成功')
                actionRef.current.reload()
                setModalData({ type: '', params: {} })
                onChange()
              }
              break
            }
            case 'publish': {
              const success = await publishReport({
                id: modalData.params.reportId,
                versionComment,
              })
              if (success) {
                message.success('发布成功')
                actionRef.current.reload()
                setModalData({ type: '', params: {} })
                onChange()
              }
              break
            }
          }
        }}
      >
        {
          [
            {
              key: 'name',
              title: '新报表名',
            },
            {
              key: 'code',
              title: '新code',
            },
          ].map((item) => {
            if (!modalData.params[`${item.key}Duplicate`]) return null
            return (
              <Form.Item
                key={item.key}
                label={item.title}
                name={item.key}
                required
                rules={[
                  { max: 50, message: '字段最长50个字符' },
                  () => ({
                    async validator (_, value) {
                      if (!value) {
                        return Promise.reject(Error(`请填写${item.title}!`))
                      }
                      const ret = await duplicateNewCheck({
                        versionRefId: modalData.params.versionRefId,
                        [item.key]: value,
                      })
                      if (ret.nameDuplicate) {
                        return Promise.reject(Error('该名称已存在!'))
                      }
                    },
                  }),
                ]}
              >
                <Input placeholder="请输入" />
              </Form.Item>
            )
          })
        }

        <Form.Item
          label="版本备注"
          name="versionComment"
        >
          <Input.TextArea
            placeholder="请输入"
            autoSize={{ minRows: 4 }}
          />
        </Form.Item>
      </BaseModal>
    </BaseModal>
  )
}

export default HistoryModal
