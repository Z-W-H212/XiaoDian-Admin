import { useEffect, useRef, useState, useCallback } from 'react'
import { sortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc'
import { Button, Form, TreeSelect, Tag, Dropdown, Menu, message, Typography, Modal } from 'antd'
import ProTable from '@ant-design/pro-table'
import { ModalForm, ProFormText, ProFormTextArea, ProFormSelect, ProFormRadio } from '@ant-design/pro-form'
import { ExclamationCircleOutlined, MenuOutlined } from '@ant-design/icons'
import ProCard from '@ant-design/pro-card'
import {
  getMenuListResource,
  addMenuButton,
  addMenuLink,
  addMenuDataImport,
  removeMenuResource,
  getReportList,
  addMenuReport,
  getDashboardList,
  addMenuDashboard,
  getMenuDetail,
  editMenuResouceLink,
  editMenuResouceButton,
  updateMenuListSort,
  updateResourceMenuPath,
  addInnerInterfaceResource,
  addOuterInterfaceResource,
  editOuterInterfaceMenuResource,
} from '@/services/admin/menu'
import { queryTemplates } from '@/services/dataImportService'
import { getTreeGroups } from '@/services/reportService'
import DebounceSelect from './component/debounce-select'

function InterfaceModel ({ edit, id, menuId, actionRef, initialValues }) {
  return (
    <ModalForm
      layout="horizontal"
      title={edit ? '编辑接口' : '添加接口'}
      trigger={<div>{edit ? '编辑' : '添加接口'}</div>}
      initialValues={initialValues || { source: '1' }}
      modalProps={{ destroyOnClose: true }}
      onFinish={async (values) => {
        const { source, reportIds, resourceValue, resourceName, props } = values
        try {
          if (source === '1') {
            await addInnerInterfaceResource({
              menuId,
              source,
              resourceValue: reportIds.map(e => (e.id)),
            })
          } else if (source === '2') {
            const params = {
              menuId,
              source,
              resourceValue,
              resourceName,
              props,
            }
            if (edit) {
              params.id = id
              await editOuterInterfaceMenuResource(params)
            } else {
              await addOuterInterfaceResource(params)
            }
          }
          message.success('提交成功')
          await actionRef.current.reloadAndRest()
          return true
        } catch (err) {
          message.error('提交失败')
        }
      }}
    >
      <ProFormRadio.Group
        name="source"
        label="接口来源"
        options={edit
          ? [
            {
              label: '外部接口',
              value: '2',
            },
          ]
          : [
            {
              label: '门户接口',
              value: '1',
            },
            {
              label: '外部接口',
              value: '2',
            },
          ]}
      />
      <Form.Item noStyle shouldUpdate>
        {(form) => {
          const source = form.getFieldValue('source')
          if (source !== '1') {
            return null
          }
          return (
            <Form.Item name="reportIds">
              <ReportPicker componentType="interface" />
            </Form.Item>
          )
        }}
      </Form.Item>
      <Form.Item noStyle shouldUpdate>
        {(form) => {
          const source = form.getFieldValue('source')
          if (source !== '2') {
            return null
          }
          return (
            <>
              <ProFormText
                name="resourceValue"
                label="接口ID"
                rules={[
                  { required: true },
                ]}
              />
              <ProFormText
                name="resourceName"
                label="接口名称"
                rules={[
                  { required: true },
                ]}
              />
              <ProFormTextArea name="props" label="自定义参数" />
            </>
          )
        }}
      </Form.Item>
    </ModalForm>
  )
}

function ReportPicker (props) {
  const { value, bizType, componentType, onChange } = props
  const valueKeys = value || []
  const [groupData, setGroupData] = useState([])
  const [groupId, setGroupId] = useState(0)
  const actionRef = useRef()

  const onRequestGroup = useCallback(async () => {
    try {
      const result = await getTreeGroups({
        bizType: 0,
        needPersonalNode: 0,
        needRootNode: 1,
        needStaticsReportSize: 0,
        needArchiveNode: 0,
        componentType,
      })
      setGroupData(result)
    } catch (err) {
      message.error('拉取模板列表失败')
    }
  }, [])

  const onRequestReport = async (value) => {
    try {
      const response = await getReportList({
        title: value,
        groupId,
        pageSize: 200,
        bizType: bizType || 0,
        currentPage: 1,
        componentType,
      })
      return response.map(e => ({
        label: e.title,
        value: e.id,
      }))
    } catch (err) {
      message.error('拉取报表列表失败')
      return []
    }
  }

  useEffect(() => {
    onRequestGroup()
  }, [])

  return (
    <>
      <Form.Item label="目标文件">
        <TreeSelect
          showSearch
          style={{ width: 300, marginRight: 16 }}
          dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
          treeData={groupData}
          placeholder="选择报表组"
          treeDefaultExpandAll
          treeNodeFilterProp="title"
          onChange={async (value) => {
            setGroupId(value)
          }}
        />
        <DebounceSelect
          showSearch
          params={{ groupId }}
          actionRef={actionRef}
          filterOption={false}
          style={{ width: 300 }}
          placeholder="支持模糊搜索"
          fetchOptions={onRequestReport}
          rules={[{ required: true, message: '请选择一个报表' }]}
          onChange={(id, result) => onChange([...valueKeys, { id: result.value, title: result.label }])}
        />
      </Form.Item>
      <Form.Item label="已选择报表">
        {valueKeys.map(item => (
          <Tag
            key={item.id}
            closable
            onClose={e => onChange([...valueKeys.filter(({ id }) => item.id !== id)])}
          >
            {item.title}
          </Tag>
        ))}
      </Form.Item>
    </>
  )
}

function Table (props) {
  const { menuId, menuTree } = props
  const actionRef = useRef()
  const [tableInfo, setTableInfo] = useState({})
  const [dataSource, setDataSource] = useState([])

  /**
   * 菜单中心报表添加资源Menu
   */
  const addResourceMenu = (
    <Menu>
      <Menu.Item>
        <ModalForm
          labelCol={{ sm: { span: 4 } }}
          wrapperCol={{ sm: { span: 18 } }}
          layout="horizontal"
          title="添加功能按钮"
          trigger={<div>添加功能按钮</div>}
          onFinish={async (values) => {
            try {
              await addMenuButton({
                ...values,
                menuId,
              })
              message.success('提交成功')
              await actionRef.current.reloadAndRest()
              return true
            } catch (err) {
              message.error('提交失败')
            }
          }}
        >
          <ProFormText name="resourceName" label="按钮名称" required />
          <ProFormText name="resourceValue" label="权限标识" />
          <ProFormTextArea name="remark" label="备注" />
        </ModalForm>
      </Menu.Item>

      <Menu.Item>
        <ModalForm
          layout="horizontal"
          title="添加数据导入模板"
          trigger={<div>添加数据导入模板</div>}
          onFinish={async (values) => {
            try {
              await addMenuDataImport({
                ...values,
                menuId,
              })
              message.success('提交成功')
              await actionRef.current.reloadAndRest()
              return true
            } catch (err) {
              message.error('提交失败')
            }
          }}
        >
          <ProFormSelect
            mode="multiple"
            name="resourceValue"
            label="模板名称"
            request={async () => {
              try {
                const result = await queryTemplates({ status: 1 })
                return result.data?.map(e => ({
                  label: e.name,
                  value: e.id,
                }))
              } catch (err) {
                message.error('拉取模板列表失败')
              }
            }}
            placeholder="请选择"
            rules={[{ required: true, message: '请选择一个模板' }]}
          />
        </ModalForm>
      </Menu.Item>

      <Menu.Item>
        <InterfaceModel menuId={menuId} actionRef={actionRef} />
      </Menu.Item>

      <Menu.Item>
        <ModalForm
          layout="horizontal"
          title="添加链接"
          trigger={<div>添加链接</div>}
          initialValues={{
            hasHangUrl: 0,
          }}
          onFinish={async (values) => {
            try {
              await addMenuLink({
                ...values,
                menuId,
              })
              message.success('提交成功')
              await actionRef.current.reloadAndRest()
              return true
            } catch (err) {
              message.error('提交失败')
            }
          }}
        >
          <ProFormText
            name="resourceName"
            label="链接名称"
            rules={[
              { required: true, max: 20, message: '字段最长20个字符' },
            ]}
          />
          <ProFormText name="resourceValue" label="链接路径" rules={[{ required: true }]} />
          <ProFormRadio.Group
            name="hasHangUrl"
            label="链接是否直接挂菜单"
            options={[
              {
                label: '直接挂靠',
                value: 1,
              },
              {
                label: '不直接挂靠',
                value: 0,
              },
            ]}
          />
        </ModalForm>
      </Menu.Item>

      <Menu.Item>
        <ModalForm
          layout="horizontal"
          title="添加报表"
          trigger={<div>添加报表</div>}
          modalProps={{ destroyOnClose: true }}
          onFinish={async (values) => {
            try {
              await addMenuReport({
                resourceValue: values.reportIds.map(e => (e.id)),
                menuId,
              })
              message.success('提交成功')
              await actionRef.current.reloadAndRest()
              return true
            } catch (err) {
              message.error('提交失败')
            }
          }}
        >
          <Form.Item name="reportIds">
            <ReportPicker />
          </Form.Item>
        </ModalForm>
      </Menu.Item>

      <Menu.Item>
        <ModalForm
          layout="horizontal"
          title="添加仪表盘"
          trigger={<div>添加仪表盘</div>}
          onFinish={async (values) => {
            try {
              await addMenuDashboard({
                ...values,
                menuId,
              })
              message.success('提交成功')
              await actionRef.current.reloadAndRest()
              return true
            } catch (err) {
              message.error('提交失败')
            }
          }}
        >
          <ProFormSelect
            mode="multiple"
            name="resourceValue"
            label="仪表盘"
            request={async () => {
              const result = await getDashboardList()
              return result.map(e => ({
                label: e.title,
                value: e.id,
              }))
            }}
            placeholder="请选择"
            rules={[{ required: true, message: '请输入仪表盘名称' }]}
          />
        </ModalForm>
      </Menu.Item>
    </Menu>
  )

  const toolBarRender = () => ([
    <Dropdown key="opt-addbutton" overlay={addResourceMenu}>
      <Button type="primary">添加资源</Button>
    </Dropdown>,
  ])

  const DragHandle = sortableHandle(() => (
    <MenuOutlined style={{ cursor: 'pointer', color: '#999' }} />
  ))

  const creatTools = (row) => {
    const key = JSON.stringify(row)
    if (row.resourceType === 5) {
      return (
        <ModalForm
          key={key}
          layout="horizontal"
          title="编辑功能按钮"
          initialValues={{
            resourceName: row.resourceName,
            resourceValue: row.resourceValue,
            remark: row.remark,
          }}
          trigger={<div>编辑</div>}
          onFinish={async (values) => {
            try {
              await editMenuResouceButton({
                ...values,
                id: row.id,
              })
              message.success('提交成功')
              await actionRef.current.reloadAndRest()
              return true
            } catch (err) {
              message.error('提交失败')
            }
          }}
        >
          <ProFormText name="resourceName" label="按钮名称" rules={[{ required: true }]} />
          <ProFormText name="resourceValue" label="权限标识" />
          <ProFormTextArea name="remark" label="备注" />
        </ModalForm>
      )
    } else if (row.resourceType === 7) {
      return (
        <InterfaceModel
          key={key}
          edit
          id={row.id}
          menuId={menuId}
          actionRef={actionRef}
          initialValues={{
            source: String(row.source),
            resourceValue: row.resourceValue,
            resourceName: row.resourceName,
            props: row.props,
          }}
        />
      )
    }
    return (
      <ModalForm
        key={key}
        layout="horizontal"
        title="编辑链接"
        trigger={<div>编辑</div>}
        initialValues={{
          resourceName: row.resourceName,
          resourceValue: row.resourceValue,
          hasHangUrl: row.hasHangUrl ? 1 : 0,
        }}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await editMenuResouceLink({
              ...values,
              id: row.id,
            })
            message.success('提交成功')
            await actionRef.current.reloadAndRest()
            return true
          } catch (err) {
            message.error('提交失败')
          }
        }}
      >
        <ProFormText
          name="resourceName"
          label="链接名称"
          rules={[
            { required: true, max: 20, message: '字段最长20个字符' },
          ]}
        />
        <ProFormText name="resourceValue" label="链接路径" rules={[{ required: true }]} />
        <ProFormRadio.Group
          name="hasHangUrl"
          label="链接是否直接挂菜单"
          options={[
            {
              label: '直接挂靠',
              value: 1,
            },
            {
              label: '不直接挂靠',
              value: 0,
            },
          ]}
        />
      </ModalForm>
    )
  }

  /**
   * 列表渲染字段，search与查询条件相关联
   */
  const columns = [
    {
      dataIndex: 'sort',
      width: 30,
      className: 'drag-visible',
      render: () => <DragHandle />,
      search: false, // 隐藏该字段的搜索显示
    },
    {
      key: 'id',
      dataIndex: 'id',
      title: 'id',
      hideInTable: true,
      search: false,
    },
    {
      key: 'resourceName',
      dataIndex: 'resourceName',
      title: '资源名称',
    },
    {
      key: 'resourceType',
      dataIndex: 'resourceType',
      title: '资源类型',
      valueType: 'select',
      valueEnum: {
        1: {
          text: '报表',
        },
        2: {
          text: '仪表盘',
        },
        3: {
          text: '数据导入模板',
        },
        4: {
          text: '链接',
        },
        5: {
          text: '功能按钮',
        },
        7: {
          text: '接口',
        },
      },
      render (value, row) {
        if (row.resourceType === 7) {
          return row.source === 1 ? '门户接口' : '外部接口'
        }
        return value
      },
    },
    {
      key: 'creatorName',
      dataIndex: 'creatorName',
      title: '添加人',
    },
    {
      title: '操作',
      valueType: 'option',
      render (_, row) {
        const { resourceType, source } = row
        const editDisabled = ![5, 4].includes(resourceType) && !(resourceType === 7 && source === 2)
        const previewDisabled = ![1, 2, 4, 5].includes(resourceType) && !(resourceType === 7 && source === 1)
        return [
          <Typography.Link key={`optin-move-${row.id}`}>
            <ModalForm
              layout="horizontal"
              title="移动资源"
              initialValues={{
                name: row.resourceName,
              }}
              trigger={<div>移动</div>}
              onFinish={async (values) => {
                try {
                  await updateResourceMenuPath({
                    newMenuId: values.newMenuId,
                    resourceIds: [row.id],
                  })
                  message.success('提交成功')
                  await actionRef.current.reload()
                  return true
                } catch (err) {
                  message.error('提交失败')
                }
              }}
            >
              <ProFormText label="菜单名称" name="name" disabled />
              <Form.Item
                name="newMenuId"
                label="目标文件夹"
                rules={[{ required: true, message: '请选择文件夹' }]}
                required
              >
                <TreeSelect
                  showSearch
                  treeData={menuTree}
                  placeholder="请选择目标文件夹"
                  treeDefaultExpandAll
                  treeNodeFilterProp="title"
                  dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                />
              </Form.Item>
            </ModalForm>
          </Typography.Link>,
          <Typography.Link key={`optin-edit-${row.id}`} disabled={editDisabled}>
            {creatTools(row)}
          </Typography.Link>,
          <Typography.Link
            disabled={previewDisabled}
            key="optin-preview"
            onClick={() => {
              if (row.resourceType === 4) {
                window.open(row.resourceValue)
              }
              if (row.resourceType === 1) {
                window.open(`/bi/preview?id=${row.resourceValue}`)
              }
              if (row.resourceType === 2) {
                window.open(`/bi/dashboard?id=${row.resourceValue}`)
              }
              if (row.resourceType === 5) {
                Modal.info({
                  title: '功能按钮 Code',
                  content: (
                    <div>
                      <Typography.Paragraph copyable>{row.resourceValue}</Typography.Paragraph>
                    </div>
                  ),
                })
              }
              if (row.resourceType === 7 && row.source === 1) {
                window.open(`/bi/preview?id=${row.resourceValue}`)
              }
            }}
          >
            预览
          </Typography.Link>,
          <Typography.Link
            key="optin-remove"
            onClick={() => {
              const modelInstance = Modal.confirm({
                title: '操作不可逆，是否确认删除？',
                icon: <ExclamationCircleOutlined />,
                async onOk () {
                  try {
                    await removeMenuResource({ id: row.id })
                    message.success('删除成功')
                    modelInstance.destroy()
                    await actionRef.current.reloadAndRest()
                  } catch (err) {
                    message.error('删除失败')
                  }
                },
              })
            }}
          >
            移除
          </Typography.Link>,
        ]
      },
    },
  ]

  const onSortEnd = async ({ oldIndex, newIndex }) => {
    const dragRow = dataSource[oldIndex]
    const dropRow = dataSource[newIndex]
    const position = oldIndex - newIndex
    await updateMenuListSort({
      dragId: dragRow.id,
      dropId: dropRow.id,
      position,
      menuId,
    })
    await actionRef.current.reloadAndRest()
  }

  /**
   * 获取菜单报表描述
   */
  const requestMenuDetail = useCallback(async () => {
    const result = await getMenuDetail(menuId)
    setTableInfo(result || {})
  }, [menuId])

  /**
   * 列表拖拽组件
   */
  const SortableItem = sortableElement(props => <tr {...props} />)
  const SortableContainer = sortableContainer(props => <tbody {...props} />)

  const DraggableContainer = props => (
    <SortableContainer
      useDragHandle
      disableAutoscroll
      helperClass="row-dragging"
      onSortEnd={onSortEnd}
      {...props}
    />
  )

  const DraggableBodyRow = ({ className, style, ...restProps }) => {
    const index = dataSource.findIndex(x => x.id === restProps['data-row-key'])
    return <SortableItem index={index} {...restProps} />
  }

  useEffect(() => {
    if (actionRef.current) {
      actionRef.current.reloadAndRest()
    }

    if (menuId) {
      requestMenuDetail()
    }
  }, [menuId, menuTree])

  if (!menuId) {
    return null
  }

  return (
    <div>
      <ProCard title={tableInfo.menuName} style={{ marginBottom: 1 }}>
        <Typography.Paragraph ellipsis={{ rows: 2, expandable: true, symbol: '更多' }}>
          {tableInfo.desc}
        </Typography.Paragraph>
      </ProCard>

      <ProTable
        rowKey="id"
        options={false}
        toolBarRender={toolBarRender}
        actionRef={actionRef}
        columns={columns}
        components={{
          body: {
            wrapper: DraggableContainer,
            row: DraggableBodyRow,
          },
        }}
        request={async (params, sorter, filter) => {
          const result = await getMenuListResource({
            menuId,
            ...params,
            orderBy: (sorter.createTime || '').slice(0, 3),
            currentPage: params.current,
          })
          setDataSource(result.list)
          return {
            data: result.list,
            success: true,
            total: Number(result.total),
          }
        }}
        search={{ labelWidth: 65 }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}

export default Table
