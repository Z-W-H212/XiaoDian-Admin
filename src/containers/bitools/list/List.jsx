import { useState, useCallback, useEffect, useRef } from 'react'
import { Tabs, Button, Space, Layout, Form, TreeSelect, message } from 'antd'
import qs from 'query-string'
import { useHistory, useLocation } from 'react-router-dom'
import Group from './components/Group'
import ReportTable from './components/ReportTable'
import { SpecialTable } from './components/SpecialTable'
import BaseModal from './components/BaseModal'
import { getTreeGroups, getReportPermission, checkUserAccessBiGroup } from '@/services/reportService'
import { obj2Url } from '@/utils/tools'

import './components/style.module.less'
const { Sider, Content } = Layout

const CreateReportModalForm = ({ groupData, visible, onCancel, onSubmit }) => {
  return (
    <BaseModal
      title="新建报表"
      visible={visible}
      onCancel={onCancel}
      onSubmit={onSubmit}
    >
      <Form.Item
        name="groupId"
        label="目标文件夹"
        required
        rules={[
          { required: true, message: '请选择目标文件夹!' },
        ]}
      >
        <TreeSelect
          showSearch
          dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
          treeData={groupData[0]?.children.slice(1)}
          placeholder="请选择"
          treeDefaultExpandAll
          treeNodeFilterProp="title"
        />
      </Form.Item>
    </BaseModal>
  )
}

const List = () => {
  const location = useLocation()
  const history = useHistory()
  const querystring = qs.parse(location.search)
  const bizType = querystring.bizType || '0'
  const [selectedGroupId, setSelectGroupId] = useState(querystring.groupId || null)
  const [createReportModal, setCreateReportModal] = useState(null) // 报表创建类型
  const [groupData, setGroupData] = useState([])
  const [groupLoading, setGroupLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userProps, setUserProps] = useState({})
  const [additionalExpandedKeys, setAdditionalExpandedKeys] = useState([])
  const [defaultSelectedKey, setDefaultSelectedKey] = useState(querystring.groupId || '')
  const [urlParams, setUrlParams] = useState(querystring || {})
  const tableRef = useRef()

  /**
   * 获取文件夹 Tree 数据
   */
  const fetchTreeData = useCallback(async () => {
    setGroupLoading(true)
    const result = await getTreeGroups({
      bizType: Number(bizType),
      needPersonalNode: 1,
      needRootNode: 1,
      needStaticsReportSize: 1,
      needArchiveNode: 1,
    })
    setGroupData(result)
    setGroupLoading(false)
  }, [bizType])

  /**
   * 获取当前角色权限
   */
  const fetchReportPermission = useCallback(async () => {
    const { isServerAdmin, adminModal } = await getReportPermission()
    setIsAdmin(isServerAdmin)
    setUserProps({ isServerAdmin, adminModal })
  }, [])

  /**
   *  标题渲染
   */
  const titleRender = (bizType) => {
    return bizType === '0' ? '报表' : '接口'
  }

  /**
   *  tab切换url传参
   */
  const onChangeBizType = (key) => {
    setUrlParams({
      bizType: key,
    })
    setSelectGroupId(null)
    setDefaultSelectedKey('')
  }

  const clearDefaultData = () => {
    setDefaultSelectedKey('')
  }

  const handleExpandTree = (record) => {
    const { groupId } = record
    // const groupId = '624318318795374593'
    const curAdditionalExpandedKeys = []
    const curGroupData = groupData[0] ? groupData[0].children : []
    let tmpKeyArr = []
    let isDfsEnd = false
    const findChildren = (node, index) => {
      tmpKeyArr[index] = node.key
      if (node.key === groupId) {
        isDfsEnd = true
        return
      }
      if (!isDfsEnd) {
        const children = node.children
        for (let i = 0; i < children.length; i++) {
          findChildren(children[i], index + 1)
        }
      }
    }
    for (const group of curGroupData) {
      if (isDfsEnd) break
      tmpKeyArr = []
      findChildren(group, 0)
    }

    if (tmpKeyArr.length) {
      tmpKeyArr.pop()
      curAdditionalExpandedKeys.push(...tmpKeyArr)

      setAdditionalExpandedKeys(curAdditionalExpandedKeys)
      setSelectGroupId(groupId)
      setDefaultSelectedKey(groupId)
    }
  }

  useEffect(() => {
    fetchTreeData()
  }, [fetchTreeData])

  useEffect(() => {
    fetchReportPermission()
  }, [fetchReportPermission])

  useEffect(() => {
    if (groupData && groupData.length && querystring.groupId) {
      handleExpandTree({ groupId: querystring.groupId })
    }
  }, [groupData])

  useEffect(() => {
    history.replace(obj2Url(urlParams, '/bi/list'))
  }, [urlParams])

  return (
    <>
      <Tabs
        activeKey={bizType}
        tabBarExtraContent={
          <Space style={{ marginBottom: '6px' }}>
            <Button
              type="primary"
              onClick={() => setCreateReportModal('GRAPH')}
            >
              可视化创建{titleRender(bizType)}
            </Button>
            <Button
              type="primary"
              onClick={() => setCreateReportModal('DSL')}
            >
              SQL创建{titleRender(bizType)}
            </Button>
          </Space>
        }
        onChange={key => onChangeBizType(key)}
      >
        <Tabs.TabPane key="0" tab="报表管理" />
        {(userProps.adminModal || userProps.isServerAdmin) && <Tabs.TabPane key="4" tab="LOV" />}
        <Tabs.TabPane key="1" tab="数据接口" />
        <Tabs.TabPane key="2" tab="聚合接口" />
        {(userProps.adminModal || userProps.isServerAdmin) && <Tabs.TabPane key="3" tab="指标查询" />}
        <Tabs.TabPane key="5" tab="特殊组件配置" />
      </Tabs>

      {urlParams.bizType !== '5'
        ? <Layout>
          <Sider theme="light" width={272} style={{ marginRight: 1 }}>
            <Group
              defaultSelectedKey={defaultSelectedKey}
              additionalExpandedKeys={additionalExpandedKeys}
              bizType={bizType}
              loading={groupLoading}
              groupData={groupData}
              height="100%"
              onChange={() => fetchTreeData()}
              onReloadReportTable={() => tableRef.current?.reloadAndRest()}
              onSelect={(id) => {
                setSelectGroupId(id)
                clearDefaultData()
                setUrlParams({ ...urlParams, groupId: id })
              }}
              onExpandTree={() => setAdditionalExpandedKeys([])}
            />
          </Sider>
          <Layout flex="auto">
            <Content>
              <ReportTable
                ref={tableRef}
                bizType={bizType}
                isAdmin={isAdmin}
                groupData={groupData}
                groupId={selectedGroupId}
                onChange={() => fetchTreeData()}
                onExpandTree={handleExpandTree}
              />
            </Content>
          </Layout>
        </Layout>
        : <Layout flex="auto">
          <SpecialTable />
        </Layout>}

      <CreateReportModalForm
        bizType={bizType}
        groupData={groupData}
        visible={!!createReportModal}
        onCancel={() => setCreateReportModal(null)}
        onSubmit={async ({ groupId }) => {
          if (['0', '1', '2'].indexOf(bizType) >= 0) {
            const checkRet = await checkUserAccessBiGroup({
              groupId,
            })
            // 4: 使用权限
            if (checkRet < 4) {
              return message.warn('没有该文件夹的权限')
            }
          }
          history.push(`/bi/createReport?mode=${createReportModal}&groupId=${groupId}&bizType=${bizType}&_groupId=${groupId}`)
        }}
      />
    </>
  )
}

export default List
