import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { Tabs, Layout } from 'antd'
import { ActionType } from '@ant-design/pro-table'

import { getAppListApi } from '@/services/admin/menu'
import ProCard from '@ant-design/pro-card'
import Group from '@/components/group'

import { ResouceRole } from './resource-role'
import { ResouceUser } from './resource-user'

import { getResourceMenu } from '@/services/admin/permission-resource'

import style from '../style.module.less'

const { Sider, Header, Content } = Layout

const resourceURL = '/permit/resource'

function PermissionResource () {
  const history = useHistory()
  const { appCode }: { appCode: string } = useParams()
  const [selectedGroup, setSelectGroup] = useState()
  const [selectResourceId, setSelectResourceId] = useState(null)
  const actionRef = useRef<ActionType>()
  const [appList, setAppList] = useState([])
  const [menuData, setMenuData] = useState()

  const appId = useMemo(() => {
    const item = appList.find(item => item.appCode === appCode)
    return item?.appId
  }, [appList, appCode])

  const getAppList = useCallback(async () => {
    const { list } = await getAppListApi()
    setAppList([...list])
  }, [])

  /**
   * 向group组件传递参数
   */
  const groupProps = {
    actionRef,
    onCreateGroup: false,
    params: {
      appId,
    },
    onSelect (key, { parentKey, resourceType }) {
      if (resourceType != null) {
        setSelectGroup(parentKey)
        setSelectResourceId(key)
      } else {
        setSelectGroup(key)
        setSelectResourceId(key)
      }
    },
    async onRequest ({ appId }) {
      if (!appId) {
        return []
      }
      let theMenuData: any[] = menuData
      if (!theMenuData) {
        const data = await getResourceMenu({})
        theMenuData = data
        setMenuData(data)
      }
      if (theMenuData instanceof Array) {
        const item = theMenuData.find(item => item.groupKey === appId)
        return item?.items || []
      }
      return []
    },
  }

  useEffect(() => {
    // getUserProps()
    getAppList()
  }, [])

  useEffect(() => {
    if (appList.length > 0) {
      const item = appList.find(item => item.appCode === appCode)
      if (!item) {
        history.push(`${resourceURL}/${appList[0].appCode}`)
      }
    }
  }, [appList, appCode])

  const onTabChange = useCallback((appCode) => {
    history.push(`${resourceURL}/${appCode}`)
  }, [])

  const content = useMemo(() => {
    if (!selectedGroup || !selectResourceId) {
      return null
    }
    return (
      <ProCard
        split="vertical"
        style={{
          position: 'relative',
        }}
      >
        <ProCard
          tabs={{
            tabPosition: 'top',
          }}
        >
          <ProCard.TabPane key="torole" tab="赋权给角色">
            <ResouceRole menuId={selectedGroup} resourceId={selectResourceId} />
          </ProCard.TabPane>
          <ProCard.TabPane key="touser" tab="赋权给用户">
            <ResouceUser menuId={selectedGroup} resourceId={selectResourceId} />
          </ProCard.TabPane>
        </ProCard>
      </ProCard>
    )
  }, [selectResourceId, selectedGroup])

  const children = useMemo(() => {
    if (!appCode) {
      return null
    }
    return (
      <Layout>
        <Header className={style.headerContainer}>
          <Tabs onChange={onTabChange} activeKey={appCode}>
            {appList.map(({ appCode, appName }) => {
              return <Tabs.TabPane key={appCode} tab={appName} />
            })}
          </Tabs>
        </Header>
        <Layout>
          <Sider theme="light" width={272} style={{ marginRight: 1 }}>
            {appList.length >= 1 && <Group {...groupProps} />}
          </Sider>
          <Content>
            {content}
          </Content>
        </Layout>
      </Layout>
    )
  }, [appList, appCode, selectResourceId, content])

  return children
}

export default PermissionResource
