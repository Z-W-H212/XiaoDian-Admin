import { useState, useRef, useMemo } from 'react'
import { Breadcrumb, Drawer, Space, Button } from 'antd'
import { PartitionOutlined } from '@ant-design/icons'
import ProList from '@ant-design/pro-list'
import { getDepartmentList } from '@/services/admin/permission-role'

/**
 * 添加部门的右侧抽屉组件
 */
export default (props) => {
  const { onFinish, onClose, visible, rowType, title, params } = props
  const actionRef = useRef()
  const [depBreadcrumb, setDepBreadcrumb] = useState([])
  const [depId, setDepId] = useState(1)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [loading, setLoading] = useState(false)

  const onClickDep = (row) => {
    const { id, key, title } = row
    setDepId(id)
    actionRef.current.reload()
    setDepBreadcrumb([...depBreadcrumb, { key, id, title }])
  }

  const onClickBreadcrumb = (index, row) => {
    let _breadcrumb, _depId
    if (index === 0) {
      _breadcrumb = []
      _depId = 1
    } else {
      _breadcrumb = [...depBreadcrumb.slice(0, index)]
      _depId = row.id
    }

    setDepBreadcrumb(_breadcrumb)
    setDepId(_depId)
    actionRef.current.reload()
  }

  const getIds = useMemo(() => {
    const depIds = []
    selectedRowKeys.forEach((e) => {
      const [type, id] = e.split('_')
      if (type === 'dep') {
        depIds.push(id)
      }
    })

    return {
      depIds,
    }
  }, [selectedRowKeys])

  const cleanState = async () => {
    setDepBreadcrumb([])
    setDepId(1)
    setSelectedRowKeys([])
    await actionRef?.current?.reloadAndRest()
  }

  const handleSubmit = async () => {
    setLoading(true)
    await onFinish(getIds)
    await cleanState()
    setLoading(false)
  }

  const handleClose = async () => {
    await cleanState()
    onClose()
  }

  /**
   * 勾选框渲染
   */
  const rowSelection = rowType === 'checkbox'
    ? {
      selectedRowKeys,
      preserveSelectedRowKeys: true,
      getCheckboxProps (value) {
        return {
          indeterminate: value.props.checked === 'true',
          disabled: value.props.operateAble === 'false',
        }
      },
      onChange: keys => setSelectedRowKeys(keys),
    }
    : null

  const drawerProps = {
    width: 500,
    title,
    onClose: handleClose,
    visible,
    closable: false,
    destroyOnClose: true,
  }

  if (rowType === 'checkbox') {
    drawerProps.footer = (
      <Space align="baseline" style={{ width: '100%', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 'normal', fontSize: '14px' }}>已选择：{getIds.depIds.length}个部门</div>
        <Space>
          <Button onClick={async () => onClose()}>取消</Button>
          <Button type="primary" onClick={async () => await handleSubmit()} loading={loading}>确认</Button>
        </Space>
      </Space>
    )
  }

  return (
    <>
      <Drawer {...drawerProps}>
        <div style={{ padding: '0 6px' }}>
          <Breadcrumb separator=">">
            <Breadcrumb.Item>通讯录</Breadcrumb.Item>
            <Breadcrumb.Item href="javascript:;" onClick={() => onClickBreadcrumb(0)}>小电科技</Breadcrumb.Item>
            {
              depBreadcrumb.map((e, i) => (
                <Breadcrumb.Item
                  key={e.key}
                  href="javascript:;"
                  onClick={() => onClickBreadcrumb(i + 1, e)}
                >
                  {e.title}
                </Breadcrumb.Item>
              ))
            }
          </Breadcrumb>
        </div>
        <ProList
          actionRef={actionRef}
          split
          loading={loading}
          metas={{
            title: {},
            description: {},
            actions: {
              render (_, row) {
                if (row._type === 'dep' && row.props.hasChildren === 'true') {
                  return (<a onClick={e => onClickDep(row)}><PartitionOutlined /> 下级</a>)
                }
              },
              search: false,
            },
          }}
          rowKey="key"
          rowSelection={rowSelection}
          request={async () => {
            setLoading(true)
            const depList = (await getDepartmentList({ deptId: depId, ...params }))
              .map(e => ({
                ...e,
                key: `dep_${e.key}`,
                description: ' ',
                id: e.key,
                _type: 'dep',
              }))

            setLoading(false)

            return {
              data: depList,
            }
          }}
        />
      </Drawer>
    </>
  )
}
