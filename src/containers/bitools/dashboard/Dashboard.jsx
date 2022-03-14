import { useState, useMemo, useEffect, useReducer } from 'react'
import { DeleteOutlined } from '@ant-design/icons'
import { useHistory, useRouteMatch } from 'react-router-dom'
import { Layout, Button, Input, Menu } from 'antd'
import Page from '@/components/layout/Page'
import Paragraph from '@/components/layout/Paragraph'
import Tools from '@/components/layout/Tools'
import Dashboard from '@/components/dashboard'

import Context from './Context'
import models from './models'

import useParseSearch from '@/hooks/useParseSearch'
import useFetch from '@/hooks/useFetch'
import { getDashboardList, getUsereDashboardConfig, delDashboard } from '@/services/dashboardService'
import { del } from '@/utils/alertMessage'

import style from './style.module.less'

const { Header, Body } = Page
const { Block, Content } = Paragraph

export default function DashboardWrap (props) {
  const history = useHistory()
  const routeMatch = useRouteMatch()
  const { id, params } = useParseSearch(props)
  const [state, dispatch] = useReducer(models.reducer, models.state)
  const [{ data }, fetchList] = useFetch(getDashboardList, { data: [] })
  const [configRes, fetchConfig] = useFetch(getUsereDashboardConfig)
  const [, fetchDelete] = useFetch(delDashboard)

  const [dashboardList, setDashboardList] = useState([])
  const paramMap = useMemo(() => params && JSON.parse(params), [params])

  useEffect(() => {
    fetchList().then(data => setDashboardList(data))
  }, [])

  useEffect(() => {
    if (id) {
      fetchConfig(id)
    }
  }, [id])

  function onCreate () {
    history.push(`${routeMatch.path}/editor`)
  }

  function onDelete (id, event) {
    event.stopPropagation()
    del(() => {
      return fetchDelete(id).then(() => {
        fetchList().then(data => setDashboardList(data))
        history.replace(routeMatch.url)
      })
    })
  }

  function onEdit () {
    history.push(`${routeMatch.path}/editor?id=${id}`)
  }

  function onSearch (searchText) {
    if (searchText === '') {
      return setDashboardList(data)
    }
    const list = data.filter((item) => {
      const { title } = item
      return title.indexOf(searchText) > -1
    })
    setDashboardList(list)
  }

  const menuList = useMemo(() => {
    return dashboardList && dashboardList.map(({ id, title }) => (
      <Menu.Item key={id}>
        <Paragraph>
          <Content>
            {title}
          </Content>
          <Block>
            <DeleteOutlined onClick={e => onDelete(id, e)} />
          </Block>
        </Paragraph>
      </Menu.Item>
    ))
  }, [dashboardList])

  const dashboardHeader = useMemo(() => {
    if (!id || !configRes.data) {
      return null
    }
    return <DashboardHeader data={configRes.data} onEdit={onEdit} />
  }, [id, configRes.data])

  const dashboard = useMemo(() => {
    if (!id || !configRes.data) {
      return null
    }
    return <Dashboard key={id} data={configRes.data} params={paramMap} />
  }, [id, configRes.data, paramMap])

  return (
    <Context.Provider value={{ state, dispatch }}>
      <Layout>
        <Paragraph className={style.dashboard}>
          <Block className={style.menu}>
            <Input.Search
              className={style.row}
              placeholder="请输入仪表盘名称"
              onSearch={onSearch}
            />
            <Tools className={style.row}>
              <div>仪表盘列表</div>
              <Tools.Right>
                <Button type="primary" onClick={onCreate}>新建仪表盘</Button>
              </Tools.Right>
            </Tools>
            <Menu
              onClick={({ key }) => {
                history.push(`${routeMatch.url}?id=${key}`)
              }}
            >
              {menuList}
            </Menu>
          </Block>
          <Content className={style.content}>
            <Page>
              <Header>
                {dashboardHeader}
              </Header>
              <Body className={style.dashboardBody}>
                {dashboard}
              </Body>
            </Page>
          </Content>
        </Paragraph>
      </Layout>
    </Context.Provider>
  )
}

function DashboardHeader (props) {
  const { title, desc, creator, updator, createTime, updateTime } = props.data
  return (
    <div className={style.dashboardHeader}>
      <Tools>
        <h1 className={style.title}>{title}</h1>
        <Tools.Right>
          <Button type="primary" onClick={props.onEdit}>编辑</Button>
        </Tools.Right>
      </Tools>
      <Tools>
        <div>创建时间：{createTime}</div>
        <div>创建人：{creator}</div>
        <div>更新时间：{updateTime}</div>
        <div>更新人：{updator}</div>
      </Tools>
      <div>描述：{desc}</div>
    </div>
  )
}
