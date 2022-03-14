import {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react'
import ProTable from '@ant-design/pro-table'
import { FolderOutlined, DownOutlined, ExclamationCircleOutlined, HddOutlined } from '@ant-design/icons'
import {
  Menu,
  Dropdown,
  Badge,
  Space,
  Button,
  Form,
  TreeSelect,
  message,
  Modal,
  Input,
  Tag,
} from 'antd'

import style from './style.module.less'
import {
  getReportList,
  publishReport,
  offlineReport,
  batchExport,
  batchPublish,
  batchMove,
  reportArchive,
  delReport,
  reportCopy,
  resotreReport,
  batchDelete,
  batchImportSave,
  getReportCheck,
  duplicateCheck,
  duplicateNewCheck,
} from '@/services/reportService'
import BaseModal from './BaseModal'
import BatchImportModal from './BatchImportModal'
import SelectVersionModal from './SelectVersionModal'
import HistoryModal from './HistoryModal'
import CopyReportModal from './CopyReportModal'
import SideMenu from './SideMenuModal'

// Table 默认展示的列控制
const defaultColumnsState = {
  id: { show: false },
  mode: { show: false },
  createTime: { show: false },
  updateTime: { show: false },
  code: { show: false },
  isLov: { show: false },
}

// 分组基础类型
const GROUP_STATUS = {
  PERSON: '-1',
  ARCHIVED: '-2',
}

// 弹窗表单控制
const MODEL_NAME = {
  SELECT_VERSION: 'SELECT_VERSION',
  HISTORY: 'HISTORY',
  BATCH_MOVE: 'BATCH_MOVE',
  BATCH_IMPORT: 'BATCH_IMPORT',
  COPY_REPORT: 'COPY_REPORT',
  RESTORE_REPORT: 'RESTORE_REPORT',
  SIDE_MENU: 'SIDE_MENU',
  PUBLISH: 'PUBLISH',
  BATCH_PUBLISH: 'BATCH_PUBLISH',
}

const LOCALSTORAGE_COLUMN_MAP_KEY = 'DATA_PORTAL_COLUMN_MAP'

const ReportTable = ({
  bizType,
  isAdmin,
  groupId,
  groupData,
  onChange,
  onExpandTree,
}, ref) => {
  const [columnsStateMap, setColumnsStateMap] = useState(getColumnStateMap())
  const [modelFormProps, setModelFormProps] = useState(null) // 根据不同按钮设置不同报表传递值
  const [userPickModal, setUserPickModal] = useState(false)
  const [isSideMenu, setIsSideMenu] = useState(false)
  const [duplicateCheckData, setDuplicateCheckData] = useState()
  const [datasource, setDatasource] = useState([])
  const modalFormRef = useRef()

  const confirmReportOperation = (record) => {
    return new Promise((resolve) => {
      if (record.online) {
        resolve(true)
      } else {
        const modelInstance = Modal.confirm({
          title: '报表的数据源已删除，请对报表做下线/归档/删除处理',
          icon: <ExclamationCircleOutlined />,
          onOk () {
            resolve(true)
            modelInstance.destroy()
          },
          onCancel () {
            resolve(false)
            modelInstance.destroy()
          },
        })
      }
    })
  }

  const columns = [
    {
      key: 'id',
      dataIndex: 'id',
      title: 'ID',
      width: 120,
      render (value, _) {
        return <span style={{ fontSize: '10px' }}>{value}</span>
      },
    },
    {
      key: 'title',
      dataIndex: 'title',
      title: '报表名称',
      width: 120,
      render (value, record) {
        return (
          <div>
            <p>
              {value}
              <span style={{ marginLeft: 8 }}>
                {typeof record.tag === 'string' &&
                  record.tag &&
                  record.tag.split(';').map(v => <Tag color="red" key={v}>{v}</Tag>)}
              </span>
            </p>
            <p className={style.reportGroupName}>
              <FolderOutlined />
              <span onClick={() => onExpandTree(record)}>{record.groupName}</span>
            </p>
            <p className={style.reportDBName}>
              {record.dsName && <HddOutlined />}
              <span className={!record.online ? style.outline : ''}>{record.dsName || ''}</span>
            </p>
          </div>
        )
      },
    },
    {
      key: 'mode',
      dataIndex: 'mode',
      title: '创建方式',
      initialValue: 'all',
      width: 80,
      valueEnum: {
        all: { text: '全部' },
        0: { text: '可视化' },
        1: { text: 'DSL' },
      },
      hideInSearch: true,
    },
    {
      key: 'createTime',
      dataIndex: 'createTime',
      title: '创建时间',
      width: 150,
      valueType: 'dateRange',
      hideInTable: true,
    },
    {
      key: 'creator',
      dataIndex: 'creator',
      title: '创建人',
      width: 100,
      render: (text, record) => (
        <div className={style.reportTableTinyCell}>
          <b>{text}</b>{record.createTime}
        </div>
      ),
    },
    {
      key: 'updateTime',
      dataIndex: 'updateTime',
      title: '更新时间',
      valueType: 'dateRange',
      width: 150,
      hideInTable: true,
    },
    {
      key: 'updator',
      dataIndex: 'updator',
      title: '更新人',
      width: 100,
      render: (text, record) => (
        <div className={style.reportTableTinyCell}>
          <b>{text}</b>{record.updateTime}
        </div>
      ),
    },
    {
      key: 'status',
      dataIndex: 'status',
      title: '发布状态',
      width: 80,
      initialValue: 'all',
      valueEnum: {
        all: { text: '全部' },
        0: { text: '保存未发布', status: 'Processing' },
        1: { text: '已发布', status: 'Success' },
        2: { text: '已下线', status: 'Default' },
        3: { text: '已归档', status: 'Default' },
      },
    },
    {
      key: 'code',
      dataIndex: 'code',
      title: 'code',
      width: 140,
    },
    {
      key: 'forTest',
      dataIndex: 'forTest',
      title: '是否是测试',
      width: 80,
      initialValue: 'all',
      hideInTable: true,
      valueEnum: {
        all: { text: '全部' },
        0: { text: '否' },
        1: { text: '是' },
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      align: 'center',
      fixed: 'right',
      render (_, record) {
        const { mode, id, option, title } = record
        const buttons = []

        // 已归档不展示编辑按钮
        if (groupId !== GROUP_STATUS.ARCHIVED) {
          if (option.hasVersion) { // 如果有hasVersion状态的话，则让用户选择多版本
            buttons.push(<a
              disabled={!option.edit} onClick={async () => {
                const res = await confirmReportOperation(record)
                if (!res) return
                setModelFormProps({
                  model: MODEL_NAME.SELECT_VERSION,
                  selectable: true,
                  shotTip: true,
                  values: { id, mode, groupId: record.groupId, button: 'edit' },
                })
              }}
            >编辑</a>)
          } else { // 没有多版本则直接跳转进去编辑
            buttons.push(<a
              disabled={!option.edit}
              onClick={async () => {
                // 先检查是否有该报表对应的数据集的权限
                const res = await confirmReportOperation(record)
                if (!res) return
                await getReportCheck({ reportId: id, type: 4 })
                window.open(`/bi/createReport?mode=${mode === 0 ? 'GRAPH' : 'DSL'}&id=${id}&bizType=${bizType}&_groupId=${record.groupId}`)
              }}
            >编辑</a>)
          }
        }

        if (option.hasVersion) {
          buttons.push(<a
            disabled={!option.edit} onClick={async () => {
              const res = await confirmReportOperation(record)
              if (!res) return
              setModelFormProps({
                model: MODEL_NAME.SELECT_VERSION,
                selectable: true,
                values: {
                  id,
                  mode,
                  groupId: record.groupId,
                  button: 'preview',
                },
              })
            }}
          >预览</a>)
        } else {
          buttons.push(<a
            disabled={!option.preview} onClick={async () => {
              const res = await confirmReportOperation(record)
              if (!res) return
              await getReportCheck({ reportId: id, type: 2 })
              window.open(`/bi/preview?id=${id}&bizType=${bizType}&groupId=${record.groupId}`)
            }}
          >预览</a>)
        }

        // 已归档展示还原按钮
        if (groupId === GROUP_STATUS.ARCHIVED) {
          buttons.push(<a
            onClick={async () => {
              const res = await confirmReportOperation(record)
              if (!res) return
              setDuplicateCheckData(null)
              setModelFormProps({
                model: MODEL_NAME.RESTORE_REPORT,
                values: {
                  reportId: id,
                  name: title,
                },
              })
            }}
          >还原</a>)

          buttons.push(<a
            onClick={async () => {
              const res = await confirmReportOperation(record)
              if (!res) return
              const modelInstance = Modal.confirm({
                title: '操作不可逆，是否确认删除？',
                icon: <ExclamationCircleOutlined />,
                async onOk () {
                  await delReport({ id })
                  message.success('删除成功')
                  modelInstance.destroy()
                  actionRef.current.reloadAndRest()
                  onChange()
                },
              })
            }}
          >删除</a>)

          buttons.push(<a
            disabled={!option.versionList}
            onClick={async () => {
              const res = await confirmReportOperation(record)
              if (!res) return
              setModelFormProps({
                model: MODEL_NAME.HISTORY,
                values: { id, mode },
              })
            }}
          >版本记录</a>)
        } else { // 归档不展示上下线和更多操作
          if (record.status === 1) { // 已发布的是下线，其余上线
            buttons.push(<a
              disabled={!option.offline}
              onClick={async () => {
                const res = await confirmReportOperation(record)
                if (!res) return
                Modal.confirm({
                  title: '下线后，原报表权限将收回，是否继续该操作？',
                  icon: <ExclamationCircleOutlined />,
                  async onOk () {
                    const success = await offlineReport({ id })
                    if (success) {
                      message.success('下线成功')
                      actionRef.current.reload()
                      onChange()
                    }
                  },
                })
              }}
            >下线</a>)
          } else {
            buttons.push(<a
              disabled={!option.publish}
              onClick={async () => {
                const res = await confirmReportOperation(record)
                if (!res) return
                setModelFormProps({
                  model: MODEL_NAME.PUBLISH,
                  values: {
                    reportId: id,
                  },
                })
                modalFormRef.current?.resetFields()
              }}
            >上线</a>)
          }

          // 更多的按钮列表
          const menu = (
            <Menu>
              <Menu.Item
                disabled={!option.versionList}
                onClick={async () => {
                  const res = await confirmReportOperation(record)
                  if (!res) return
                  setModelFormProps({
                    model: MODEL_NAME.HISTORY,
                    selectable: false,
                    values: { id, mode },
                  })
                }}
              >
                版本记录
              </Menu.Item>
              <Menu.Item
                disabled={!option.move}
                onClick={async () => {
                  const res = await confirmReportOperation(record)
                  if (!res) return
                  setModelFormProps({
                    model: MODEL_NAME.BATCH_MOVE,
                    values: {
                      ids: [id],
                      names: [title],
                    },
                  })
                }}
              >
                移动到
              </Menu.Item>
              <Menu.Item
                disabled={!option.copy}
                onClick={async () => {
                  const res = await confirmReportOperation(record)
                  if (!res) return
                  setModelFormProps({
                    model: MODEL_NAME.COPY_REPORT,
                    isAdmin,
                    values: { id, bizType, title },
                  })
                }}
              >
                复制
              </Menu.Item>
              <Menu.Item
                style={{ display: record.status !== 1 ? 'none' : '' }}
                onClick={async () => {
                  const res = await confirmReportOperation(record)
                  if (!res) return
                  setModelFormProps({
                    model: MODEL_NAME.SIDE_MENU,
                    values: { id, bizType, title, mode },
                  })
                  setIsSideMenu(true)
                  setUserPickModal(true)
                }}
              >
                挂靠菜单
              </Menu.Item>
              <Menu.Item
                disabled={!option.delete}
                onClick={async () => {
                  const res = await confirmReportOperation(record)
                  if (!res) return
                  const modelInstance = Modal.confirm({
                    title: '操作不可逆，是否确认删除？',
                    icon: <ExclamationCircleOutlined />,
                    async onOk () {
                      await delReport({ id })
                      message.success('删除成功')
                      modelInstance.destroy()
                      actionRef.current.reloadAndRest()
                      onChange()
                    },
                  })
                }}
              >
                删除
              </Menu.Item>
              <Menu.Item
                disabled={!option.archive}
                onClick={async () => {
                  const res = await confirmReportOperation(record)
                  if (!res) return
                  Modal.confirm({
                    title: '操作不可逆，是否确认归档？',
                    icon: <ExclamationCircleOutlined />,
                    async onOk () {
                      const success = await reportArchive({ id })
                      if (success) {
                        message.success('归档成功')
                        actionRef.current.reloadAndRest()
                        onChange()
                      }
                    },
                  })
                }}
              >
                归档
              </Menu.Item>
            </Menu>
          )

          buttons.push(<Dropdown overlay={menu}>
            <Badge dot={option.isNew}>
              <a onClick={() => { }}>更多 <DownOutlined /></a>
            </Badge>
          </Dropdown>)
        }
        return buttons
      },
    },
  ]

  // 批量导入入口按钮
  const toolBarRender = () => ([
    <Button
      key="opt-import"
      type="primary"
      onClick={() => {
        setModelFormProps({
          model: MODEL_NAME.BATCH_IMPORT,
          values: { bizType },
        })
      }}
    >
      批量导入
    </Button>,
  ])

  // 表格多选提示器
  const tableAlertRender = ({ selectedRowKeys, selectedRows, onCleanSelected }) => (
    <Space size={24}>
      <span>
        已选 {selectedRowKeys.length} 项 <a style={{ marginLeft: 8 }} onClick={onCleanSelected}>取消选择</a>
      </span>
    </Space>
  )

  // 表格多选工具栏
  const tableAlertOptionRender = ({ selectedRowKeys, selectedRows }) => (
    <Space>
      <a onClick={() => batchExport({ reportIds: selectedRowKeys })}>批量导出配置</a>
      {
        groupId === GROUP_STATUS.ARCHIVED
          ? ( // 已归档仅可以批量删除
            <a
              onClick={() => {
                const modelInstance = Modal.confirm({
                  title: '操作不可逆，是否确认删除？',
                  icon: <ExclamationCircleOutlined />,
                  async onOk () {
                    const success = await batchDelete({ reportIds: selectedRowKeys })
                    if (success) {
                      message.success('批量删除成功')
                      modelInstance.destroy()
                      actionRef.current.reloadAndRest()
                      onChange()
                    }
                  },
                })
              }}
            >批量删除</a>)
          : (<>
            {
              groupId === GROUP_STATUS.PERSON
                ? null
                : (
                  <a
                    onClick={async () => {
                      setModelFormProps({
                        model: MODEL_NAME.BATCH_PUBLISH,
                        values: { selectedRowKeys },
                      })
                      modalFormRef.current?.resetFields()
                    }}
                  >批量发布</a>
                )
            }

            <a onClick={() => {
              setModelFormProps({
                model: MODEL_NAME.BATCH_MOVE,
                values: {
                  ids: selectedRowKeys,
                  names: selectedRows.map(e => e.title),
                },
              })
            }}
            >批量移动</a>
          </>)
      }
    </Space>
  )

  const actionRef = useRef()

  useImperativeHandle(ref, () => ({
    reloadAndRest () {
      actionRef.current?.reloadAndRest()
    },
  }))

  const defaultModelFormProps = {
    visible: !!modelFormProps,
    onCancel: () => setModelFormProps(null),
    ...modelFormProps,
  }

  useEffect(() => {
    if (actionRef.current) {
      actionRef.current.reloadAndRest()
    }
  }, [bizType, groupId])

  return (
    <>
      <ProTable
        rowKey="id"
        rowSelection={{
          preserveSelectedRowKeys: true,
          columnWidth: '20px',
        }}
        tableAlertRender={tableAlertRender}
        tableAlertOptionRender={tableAlertOptionRender}
        toolBarRender={toolBarRender}
        actionRef={actionRef}
        columnsStateMap={columnsStateMap}
        onColumnsStateChange={(map) => { // 缓存ProTable工具栏选项
          const columnMap = map && Object.keys(map).length ? map : defaultColumnsState
          window.localStorage.setItem('DATA_PORTAL_COLUMN_MAP', JSON.stringify(columnMap))
          setColumnsStateMap(columnMap)
        }}
        columns={columns}
        request={async (params, sorter, filter) => {
          const ret = await getReportList({ bizType, groupId, ...params, sorter, filter })
          setDatasource(ret.data)
          return ret
        }}
        search={{ labelWidth: 72 }}
        scroll={{ x: 'max-content' }}
      />

      {
        modelFormProps?.model === MODEL_NAME.BATCH_MOVE &&
        (
          <BaseModal
            {...defaultModelFormProps}
            title="移动文件路径"
            onSubmit={async ({ ids, groupId }) => {
              await batchMove({ reportIds: ids, groupId })

              message.success('操作成功')
              actionRef.current.reloadAndRest()
              setModelFormProps(null)
              onChange()
            }}
          >
            <Form.Item label="文件夹名">
              {modelFormProps.values.names.join(';')}
            </Form.Item>
            <Form.Item name="groupId" label="目标文件夹" rules={[{ required: true, message: '请选择目标文件夹!' }]}>
              <TreeSelect
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                treeData={groupData[0].children.slice(2)}
                placeholder="请选择"
                treeDefaultExpandAll
                showSearch
                treeNodeFilterProp="title"
              />
            </Form.Item>
          </BaseModal>
        )
      }

      {
        modelFormProps?.model === MODEL_NAME.RESTORE_REPORT &&
        (
          <BaseModal
            {...defaultModelFormProps}
            title="文件还原"
            onSubmit={async ({ reportId, groupId, newName, newCode }) => {
              if (!(newName || newCode)) {
                const checkRet = await duplicateCheck({ reportId })
                if (checkRet.nameDuplicate || checkRet.codeDuplicate) {
                  return setDuplicateCheckData(checkRet)
                }
              }

              await resotreReport({ reportId, groupId, newName, newCode })

              message.success('操作成功')
              actionRef.current.reloadAndRest()
              setModelFormProps(null)
              onChange()
            }}
          >
            <Form.Item label="文件名">
              {modelFormProps.values.name}
            </Form.Item>
            <Form.Item
              name="groupId"
              label="目标文件夹"
              rules={[
                { required: true, message: '请选择目标文件夹!' },
              ]}
            >
              <TreeSelect
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                treeData={groupData[0].children.slice(2)}
                placeholder="请选择"
                treeDefaultExpandAll
              />
            </Form.Item>
            {
              duplicateCheckData && [{
                key: 'name',
                name: 'newName',
                title: '新文件名',
              }, {
                key: 'code',
                name: 'newCode',
                title: '新code',
              }].map((item) => {
                if (!duplicateCheckData[`${item.key}Duplicate`]) return null
                return (
                  <Form.Item
                    key={item.key}
                    label={item.title}
                    name={item.name}
                    required
                    rules={[
                      () => ({
                        async validator (_, value) {
                          if (!value) {
                            return Promise.reject(Error(`请填写${item.title}!`))
                          }
                          const ret = await duplicateNewCheck({
                            versionRefId: duplicateCheckData.versionRefId,
                            [item.key]: value,
                          })
                          if (ret[`${item.key}Duplicate`]) {
                            return Promise.reject(Error('该名称已存在!'))
                          }
                        },
                      }),
                    ]}
                  >
                    <Input placeholder={`请输入${item.title}`} />
                  </Form.Item>
                )
              })
            }
          </BaseModal>
        )
      }

      {
        modelFormProps?.model === MODEL_NAME.HISTORY &&
        (
          <HistoryModal
            {...defaultModelFormProps}
            title="版本记录"
            onChange={() => { actionRef.current.reload() }}
            onSubmit={async () => {
              setModelFormProps(null)
            }}
          />
        )
      }

      {
        modelFormProps?.model === MODEL_NAME.SELECT_VERSION &&
        (
          <SelectVersionModal
            {...defaultModelFormProps}
            title="选择版本"
            onChange={() => { actionRef.current.reload() }}
            onSubmit={async ({ mode, reportId, groupId, button, versionCode }) => {
              await getReportCheck({ reportId, versionCode, type: button === 'edit' ? 4 : 2 })
              if (button === 'edit') {
                window.open(`/bi/createReport?mode=${mode === 0 ? 'GRAPH' : 'DSL'}&id=${reportId}&versionCode=${versionCode}&bizType=${bizType}&_groupId=${groupId}`)
              }
              if (button === 'preview') {
                window.open(`/bi/preview?id=${reportId}&versionCode=${versionCode}&bizType=${bizType}&groupId=${groupId}`)
              }
              setModelFormProps(null)
            }}
          />
        )
      }

      {
        modelFormProps?.model === MODEL_NAME.BATCH_IMPORT &&
        (
          <BatchImportModal
            {...defaultModelFormProps}
            treeData={groupData}
            title="批量导入"
            onSubmit={async ({ groupId, importList, taskKey }) => {
              await batchImportSave({
                bizType,
                groupId,
                recordList: importList.map(e => ({
                  reportId: e.reportId,
                  targetSourceName: e.targetSourceName,
                  newName: e.nameDuplicate ? e.name : undefined,
                })),
                taskKey,
              })
              message.success('批量导入成功')
              actionRef.current.reloadAndRest()
              setModelFormProps(null)
              onChange()
            }}
          />
        )
      }

      {
        modelFormProps?.model === MODEL_NAME.COPY_REPORT &&
        (
          <CopyReportModal
            {...defaultModelFormProps}
            title="复制报表"
            groupData={groupData}
            onSubmit={async ({ id, title, groupId, bizType }) => {
              await reportCopy({ id, bizType, groupId, title })
              message.success('复制成功')
              actionRef.current.reloadAndRest()
              setModelFormProps(null)
              onChange()
            }}
          />
        )
      }

      {
        modelFormProps?.model === MODEL_NAME.SIDE_MENU &&
        (
          <SideMenu
            values={modelFormProps}
            visible={userPickModal}
            isSideMenu={isSideMenu}
            onClose={() => setUserPickModal(null)}
          />
        )
      }

      {
        modelFormProps?.model === MODEL_NAME.PUBLISH &&
        (
          <BaseModal
            {...defaultModelFormProps}
            title="上线"
            formRef={modalFormRef}
            onSubmit={async ({ reportId, versionComment }) => {
              const success = await publishReport({ id: reportId, versionComment })
              if (success) {
                message.success('上线成功')
                actionRef.current.reload()
                onChange()
                setModelFormProps(null)
              }
            }}
          >
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
        )
      }

      {
        modelFormProps?.model === MODEL_NAME.BATCH_PUBLISH &&
        (
          <BaseModal
            {...defaultModelFormProps}
            title="批量发布——版本备注"
            formRef={modalFormRef}
            formProps={{
              labelCol: { span: 0 },
              wrapperCol: { span: 24 },
            }}
            onSubmit={async ({ selectedRowKeys, ...values }) => {
              const versionComments = selectedRowKeys.map(key => values[key])

              const success = await batchPublish({ reportIds: selectedRowKeys, versionComments })
              if (success) {
                message.success('批量发布成功')
                actionRef.current.reloadAndRest()
                onChange()
                setModelFormProps(null)
              }
            }}
          >
            {
              modelFormProps.values.selectedRowKeys.map((key) => {
                const item = datasource.find(v => v.id === key)
                return (
                  <div key={key}>
                    <p>报表名: {item.title}</p>
                    <Form.Item
                      style={{ width: '100%' }}
                      key={key}
                      name={key}
                    >
                      <Input.TextArea
                        placeholder="请输入版本备注"
                        autoSize={{ minRows: 4 }}
                      />
                    </Form.Item>
                  </div>
                )
              })
            }
          </BaseModal>
        )
      }
    </>
  )
}

function getColumnStateMap () {
  const _lsColumnMap = window.localStorage.getItem(LOCALSTORAGE_COLUMN_MAP_KEY)
  if (!_lsColumnMap) {
    window.localStorage.setItem(LOCALSTORAGE_COLUMN_MAP_KEY, JSON.stringify(defaultColumnsState))
    return defaultColumnsState
  }

  try {
    return JSON.parse(_lsColumnMap)
  } catch (err) {
    return null
  }
}

export default forwardRef(ReportTable)
