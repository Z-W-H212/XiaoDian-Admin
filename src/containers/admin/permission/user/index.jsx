import { useEffect, useCallback, useState } from 'react'
import { Route, Switch, Redirect, useHistory, useLocation } from 'react-router-dom'
import { Tabs, Layout } from 'antd'
import { dcapi } from '@/utils/axios'

import UserList from './01-list'
import UserExternal from './02-external'
import UserSubuser from './03-subuser'

const adminRoutes = [
  {
    title: '用户二级授权',
    path: '/permit/user/subuser',
    component: UserSubuser,
  },
]

function PermissionUser () {
  const location = useLocation()
  const history = useHistory()
  /**
   * 路由列表
   */
  const [routes, setRoutes] = useState([
    {
      title: '用户列表',
      path: '/permit/user/list',
      component: UserList,
    },
    {
      title: '角色外权限配置',
      path: '/permit/user/external',
      component: UserExternal,
    },
  ])

  const getUserProps = useCallback(async (ticket) => {
    const data = await dcapi.get('/diana/user/v1/getUserProps')
    if (data && data.isServerAdmin === 1) {
      setRoutes([...routes, ...adminRoutes])
    }
  }, [])

  useEffect(() => {
    getUserProps()
  }, [])

  return (
    <>
      <Tabs onChange={e => history.push(e)} activeKey={location.pathname}>
        {
          routes.map(e => (
            <Tabs.TabPane key={e.path} tab={e.title} />
          ))
        }
      </Tabs>
      <Layout>
        <Switch>
          <Redirect exact from="/permit/user" to="/permit/user/list" />
          {
            routes.map(e => (
              <Route exact key={e.path} path={e.path} component={e.component} />
            ))
          }
        </Switch>
      </Layout>
    </>
  )
}

export default PermissionUser
