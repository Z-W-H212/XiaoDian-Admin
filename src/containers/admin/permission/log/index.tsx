import { useEffect, useState, useMemo, useContext } from 'react'
import { Route, Switch, Redirect, useHistory } from 'react-router-dom'
import { Tabs, Layout, Select, Empty } from 'antd'
import ProProvider from '@ant-design/pro-provider'
import UserResourceAuthList from './01-user-resource-auth-list'
import ResourceAuthChangeLog from './02-resource-auth-change-log'
import UserRoleChangeLog from './03-user-role-change-log'
import DataAuthChangeLog from './04-data-auth-change-log'
import { getDeptSearchApi } from '@/services/admin/permission-log'
import useFetch from '@/hooks/useFetch'
import useDebounceFn from '@/hooks/useDebounceFn'

const { Option } = Select

const routes = [
  {
    title: '用户资源权限清单',
    path: '/permit/log/user-resource-auth-list',
    component: UserResourceAuthList,
  },
  {
    title: '资源权限变更日志',
    path: '/permit/log/resource-auth-change-log',
    component: ResourceAuthChangeLog,
  },
  {
    title: '用户角色变更日志',
    path: '/permit/log/user-role-change-log',
    component: UserRoleChangeLog,
  },
  {
    title: '数据权限变更日志',
    path: '/permit/log/data-auth-change-log',
    component: DataAuthChangeLog,
  },
]

function SearchDept (text, props) {
  const [search, setSearch] = useState('')
  const [{data, loading}, getDeptSearch] = useFetch(getDeptSearchApi, { data: []})

  useDebounceFn(() => {
    search && getDeptSearch(search)
  }, [search])

  return (
    <Select
      showSearch
      allowClear
      placeholder="请选择"
      {...props}
      {...props?.fieldProps}
      filterOption={false}
      onSearch={setSearch}
      notFoundContent={search ? <Empty/> : null}
      loading={loading}
      onClear={() => setSearch('')}
    >
      {
        (search ? data : []).map(item => <Option key={item.deptId} value={item.deptId}>{item.name} <span style={{fontSize: 12, color: '#999'}}>{item.parentName}</span></Option>)
      }
    </Select>
  )
}

export default function Log (): JSX.Element {
  const history = useHistory()
  const [activeKey, setActiveKey] = useState('')

  const values = useContext(ProProvider)

  const onTabChange = (e) => {
    history.replace(e)
    setActiveKey(e)
  }

  useEffect(() => {
    setActiveKey(location.pathname)
  }, [])

  return (
    <>
      <Tabs onChange={onTabChange} activeKey={activeKey}>
        {
          routes.map(e => (
            <Tabs.TabPane key={e.path} tab={e.title} />
          ))
        }
      </Tabs>
      <Layout>
        <ProProvider.Provider
          value={{
            ...values,
            valueTypeMap: {
              'search-dept': {
                renderFormItem: SearchDept,
              },
            },
          }}
        >
          <Switch>
            <Redirect exact from="/permit/log" to="/permit/log/user-resource-auth-list" />
            {routes.map(e => <Route exact key={e.path} path={e.path} component={e.component} />)}
          </Switch>
        </ProProvider.Provider>
      </Layout>
    </>
  )
}
