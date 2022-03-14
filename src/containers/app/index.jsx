import { useState, useEffect, useCallback } from 'react'
import { Link, useHistory, useLocation } from 'react-router-dom'
import ProLayout, { PageContainer } from '@ant-design/pro-layout'
import { Avatar, Typography, Space, Menu, Dropdown } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { systemRoutes } from '@/router/routes'
import { signout } from '@/services/permissionService'
import { getAdminMenu } from '@/services/admin/menu'
import DataPermission from '@/components/DataPermission'
import { env } from '@/env/admin'
import { supplyRoutes } from '@/router/utils'
import './style.less'

function App ({ children }) {
  const history = useHistory()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [userAvatar, setUseravatar] = useState('')
  const [menuData, setMenuData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let userInfo
    try {
      userInfo = JSON.parse(window.localStorage.getItem('userInfo'))
      setUsername(userInfo.nickName)
      setUseravatar(userInfo.avatarUrl)
    } catch (err) {
      setUsername('未登录')
    }
  }, [])

  const onSignout = async () => {
    await signout()
    window.localStorage.removeItem('userInfo')
    window.localStorage.removeItem('role')
    window.localStorage.removeItem('token')
    window.location.href = `${env.auth}/logout?redirect_uri=${window.location.origin}`
  }

  const menu = (
    <Menu>
      <Menu.Item onClick={() => onSignout()}>
        退出登录
      </Menu.Item>
    </Menu>
  )

  const topbarRight = (
    <Space>
      <div>
        <span>数据权限：</span>
        <DataPermission />
      </div>
      <Typography.Link href="http://confluence.dian.so/pages/viewpage.action?pageId=17797600" target="_blank">帮助文档</Typography.Link>
      <Dropdown overlay={menu}>
        <Typography.Text>
          <Avatar shape="square" size="small" src={userAvatar} icon={<UserOutlined />} style={{ marginRight: '8px' }} />
          {username}
        </Typography.Text>
      </Dropdown>
    </Space>
  )

  function menuBuilder (item) {
    const result = {
      name: item.title,
      path: item.url,
      children: item.children,
    }

    // 资源
    if (item.hasHangUrl) {
      result.path = item.url
    }
    // 资源
    if (item.sourceList.length) {
      result.children = resourceBuilder(item.sourceList)
    }
    return result
  }

  function resourceBuilder (item) {
    return item.map((e) => {
      const resource = {
        name: e.title,
      }
      // 报表
      if (e.type === 1) {
        resource.path = `/bi/preview?id=${e.resourceValue}`
      }
      // 仪表盘
      if (e.type === 2) {
        resource.path = `/bi/dashboard?id=${e.resourceValue}`
      }
      // 链接
      if (e.type === 4) {
        resource.path = e.resourceValue
      }
      return resource
    })
  }

  function setMenuTree (list) {
    const map = {}
    const tree = []

    for (let i = 0; i < list.length; i++) {
      map[list[i].id] = list[i]
      list[i].children = []
    }

    for (let i = 0; i < list.length; i += 1) {
      const node = list[i]
      if (node.parentId) {
        map[node.parentId].children.push(menuBuilder(node))
      } else {
        tree.push(menuBuilder(node))
      }
    }

    return tree
  }
  const proLayoutProps = {
    location: location,
    fixedHeader: true,
    fixSiderbar: true,
    disableContentMargin: true,
    primaryColor: '#1E87F0',
    logo: (<i className="iconfont icondianshujumenhu logo-dian" style={{ fontSize: '22px' }} />),
    title: '数据中台',
    iconfontUrl: '//at.alicdn.com/t/font_2003665_d8u0llaronh.js',
    navTheme: 'light',
    onMenuHeaderClick: () => history.push('/'),
    rightContentRender: () => topbarRight,
    headerRender: false,
    menu: { loading, defaultOpenAll: true },
    menuDataRender: () => menuData,
    menuItemRender (item, dom) {
      if (/^https?:\/\//.test(item.path)) {
        return <a href={item.path} target="_blank" rel="noreferrer">{item.name}</a>
      }
      return item.path ? <Link to={item.path}>{item.title || item.name}</Link> : <div>{item.name}</div>
    },
    contentStyle: {
      background: '#f6f7f9',
    },
  }

  const requestAdminMenu = useCallback(async () => {
    setLoading(true)
    const menuList = await getAdminMenu()
    const merge = setMenuTree(menuList)
    setMenuData([...supplyRoutes(systemRoutes), ...merge])
    setLoading(false)
  }, [])

  useEffect(() => {
    setMenuData([])
    requestAdminMenu()
  }, [])

  return (
    <div
      style={{
        height: '100vh',
        // overflow: 'auto',
      }}
    >
      <ProLayout {...proLayoutProps}>
        <PageContainer
          ghost
          header={{
            breadcrumb: false,
          }}
          extra={topbarRight}
          content={children}
        />

      </ProLayout>
    </div>
  )
}

export default App
