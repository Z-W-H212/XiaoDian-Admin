import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Modal, Button, Row, Col, Table, Typography, Divider, Popconfirm, message } from 'antd'
import { MenuOutlined } from '@ant-design/icons'
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc'
import { editAppListApi, deleteAppApi } from '@/services/admin/menu'
import { DataSourceItem, ManageSystemProps, BaseConfigModalRef } from './types'
import BaseConfigModal from './base-config-modal'

const SortableItem = SortableElement(props => <tr {...props} />)
const SortableContainerWrap = SortableContainer(props => <tbody {...props} />)
const DragHandle = SortableHandle(() => (
  <MenuOutlined style={{ cursor: 'pointer', color: '#999' }} />
))

let uuid = 0
export const getUuid: () => number = () => uuid++

const ManageSystem: React.FC<ManageSystemProps> = (props: ManageSystemProps) => {
  const { appList: data } = props
  const [visible, setVisible] = useState(false)
  const baseConfigInstance = useRef<BaseConfigModalRef>()

  const [dataSource, setDataSource] = useState<DataSourceItem[]>([])

  useEffect(() => {
    setDataSource(data.reduce((arr, val) => [...arr, { ...val, uuid: getUuid() }], []))
  }, [data, visible])

  const onDel = useCallback(async (row, index) => {
    const appId = dataSource[index].appId
    if (appId) {
      await deleteAppApi({ appId })
      message.success('删除成功')
      props.onGetAppList()
      return
    }
    dataSource.splice(index, 1)
    setDataSource([...dataSource])
  }, [dataSource])

  const columns = useMemo(() => {
    return [
      {
        dataIndex: 'sort',
        width: 30,
        className: 'drag-visible',
        render: () => <DragHandle />,
      }, {
        dataIndex: 'appCode',
        title: '应用端id',
      }, {
        dataIndex: 'appName',
        title: '应用端名称',
      }, {
        dataIndex: 'description',
        title: '描述',
      }, {
        title: '操作',
        width: 120,
        render: (_, row, index) => [
          <Typography.Link key={`optin-move-${row.appId}-1`} onClick={() => baseConfigInstance.current.show(row)}>编辑</Typography.Link>,
          <Divider type="vertical" key={`optin-move-${row.appId}-0`} />,
          <Popconfirm key={`optin-move-${row.appId}-2`} placement="top" title="确认删除？" onConfirm={() => onDel(row, index)}>
            <Typography.Link>删除</Typography.Link>
          </Popconfirm>,
        ],
      },
    ]
  }, [baseConfigInstance, onDel])

  const onSortEnd = ({ oldIndex, newIndex }) => {
    const removeItem = dataSource[oldIndex]
    dataSource.splice(oldIndex, 1)
    dataSource.splice(newIndex, 0, removeItem)
    setDataSource([...dataSource])
  }

  const DraggableContainer = props => (
    <SortableContainerWrap
      useDragHandle
      disableAutoscroll
      helperClass="xd-row-dragging"
      onSortEnd={onSortEnd}
      {...props}
    />
  )

  const DraggableBodyRow = ({ className, style, ...restProps }) => {
    const index = dataSource.findIndex(x => x.uuid === restProps['data-row-key'])
    return <SortableItem index={index} {...restProps} />
  }

  const onBaseConfigModalOk = (type: string, item: DataSourceItem) => {
    if (type === 'edit') {
      const findItem = dataSource.find(val => val.uuid === item.uuid)
      findItem && Object.keys(item).forEach(key => (findItem[key] = item[key]))
      setDataSource([...dataSource])
    } else {
      setDataSource([...dataSource, item])
    }
  }

  const onSubmit = async () => {
    const list = []
    dataSource.forEach((item, index) => {
      list.push({
        appId: item.appId,
        appCode: item.appCode,
        appName: item.appName,
        description: item.description,
        sort: index,
      })
    })

    await editAppListApi(list)
    message.success('保存成功')
    props.onGetAppList()
    setVisible(false)
  }

  return (
    <>
      <Button type="primary" onClick={() => setVisible(true)}>应用管理</Button>
      <Modal
        title="应用端管理"
        width={720}
        visible={visible}
        onOk={onSubmit}
        onCancel={() => setVisible(false)}
      >
        <Row style={{ marginBottom: 12 }}>
          <Col flex="auto">应用端列表</Col>
          <Col><Button type="primary" onClick={() => baseConfigInstance.current.show()}>新增应用端</Button></Col>
        </Row>
        <Table
          pagination={false}
          dataSource={dataSource}
          columns={columns}
          rowKey="uuid"
          components={{
            body: {
              wrapper: DraggableContainer,
              row: DraggableBodyRow,
            },
          }}
        />
      </Modal>
      <BaseConfigModal ref={baseConfigInstance} onOk={onBaseConfigModalOk} dataSource={dataSource} />
    </>
  )
}

export default ManageSystem
