import { useState, useEffect, useCallback } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { Tabs } from 'antd'
import { getAppListApi } from '@/services/admin/menu'
import Dataset from './dataset'

import Resource from './resource'
import BiSpace from './bispace'

const resourceURL = '/permit/resource'

function PermissionResource () {
  const history = useHistory()
  const { appCode }: { appCode: string } = useParams()
  const [appList, setAppList] = useState([])

  const getAppList = useCallback(async () => {
    const { list } = await getAppListApi()
    setAppList([...list])
  }, [])

  useEffect(() => {
    // getUserProps()
    getAppList()
  }, [])

  useEffect(() => {
    if (appList.length > 0) {
      const item = appList.find(item => item.appCode === appCode)
      if (!item) {
        history.replace(`${resourceURL}/${appList[0].appCode}`)
      }
    }
  }, [appList, appCode])

  return (
    <Tabs>
      <Tabs.TabPane key="1" tab="菜单权限">
        <Resource />
      </Tabs.TabPane>
      <Tabs.TabPane key="2" tab="数据集权限">
        <Dataset />
      </Tabs.TabPane>
      <Tabs.TabPane key="3" tab="BI空间权限">
        <BiSpace />
      </Tabs.TabPane>
    </Tabs>
  )
}

export default PermissionResource
