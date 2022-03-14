import { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Table, Button } from 'antd'

import SearchFrom from '@/components/search-form'
import Drawer from './Drawer'
import { indexList } from './keys'
import { del } from '@/utils/alertMessage'
import { delDataPerMission } from '@/services/permissionService'

import style from './style.module.less'

const searchData = [
  {
    key: 'nickName',
    title: '花名',
    type: 'TEXT',
    defaultValue: '',
    list: [
      { title: '全部', value: '' },
      { title: '目标看板', value: '1' },
      { title: 'qweqwe', value: '2' },
    ],
  },
  {
    key: 'status',
    title: '在职状态',
    type: 'RADIO',
    defaultValue: '',
    list: [
      { title: '在职', value: '0' },
      { title: '离职', value: '1' },
      { title: '离职中', value: '2' },
    ],
  },
  {
    key: 'updator',
    title: '更新人',
    type: 'TEXT',
    defaultValue: '',
  },
  {
    key: 'updateTime',
    title: '更新时间',
    type: 'DATE',
    defaultValue: '',
  },
]

function Data (props) {
  const [columns, setColumns] = useState([])
  const [showDrawer, setShowDrawer] = useState(false)
  const [userInfo, setUserInfo] = useState(null)

  useEffect(() => {
    props.getPermissionList({})
    setColumns(createColumns(indexList))
  }, [])

  function createColumns (indexList) {
    const columns = indexList.map((item) => {
      const { key, title, width, render } = item
      return {
        key,
        dataIndex: key,
        title,
        width,
        render,
      }
    })
    columns.push({
      key: 'other',
      dataIndex: 'other',
      title: '操作',
      width: 100,
      render (v, row) {
        return (
          <div>
            <a onClick={() => onEdit(row)}>编辑</a>&nbsp;
            <a onClick={() => onDel(row)}>删除</a>
          </div>
        )
      },
    })

    return columns
  }

  function onEdit (row) {
    setUserInfo(row)
    setShowDrawer(true)
  }

  function onDel (row) {
    const { sequence } = row
    del(async () => {
      await delDataPerMission(sequence)
      props.getPermissionList({})
    })
  }

  function onSearch (values) {
    props.getPermissionList(values)
  }

  function onConfirm () {
    setUserInfo(null)
    setShowDrawer(false)
    props.getPermissionList({})
  }

  function onCancel () {
    setUserInfo(null)
    setShowDrawer(false)
  }

  return (
    <div className={style.container}>
      <div className={style.tools}>
        <Button className={style.item} onClick={() => setShowDrawer(true)}>新增权限</Button>
      </div>
      <SearchFrom data={searchData} onSearch={onSearch} />
      <Table
        loading={!(props.permissionList && props.permissionList.length > 0)}
        rowKey={row => row.sequence}
        columns={columns}
        dataSource={props.permissionList}
      />
      <Drawer
        visible={showDrawer}
        data={userInfo}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </div>
  )
}

export default connect(
  state => ({
    userIdMap: state.global.userIdMap,
    permissionList: state.super.permissionList,
  }),
  dispatch => ({
    getPermissionList: dispatch.super.getPermissionList,
    addPermission: dispatch.super.addPermission,
  }),
)(Data)
