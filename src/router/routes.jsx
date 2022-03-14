export const publicRoutes = [
  {
    path: '/login',
    title: 'login',
    component: () => import('@/containers/login'),
  },
]

export const systemRoutes = [
  {
    path: '/bi',
    title: 'BI工具',
    name: 'BI工具',
    icon: 'icon-bi',
    hideInMenu: true,
    children: [
      {
        path: '/createReport',
        title: '创建报表',
        name: '创建报表',
        hideInMenu: true,
        component: () => import('@/containers/bitools/createReport'),
      },
      {
        path: '/preview',
        title: '创建报表',
        name: '创建报表',
        hideInMenu: true,
        component: () => import('@/containers/bitools/preview'),
      },
      {
        path: '/dashboard/editor',
        title: '编辑仪表盘',
        name: '编辑仪表盘',
        hideInMenu: true,
        component: () => import('@/containers/bitools/dashboard/editor'),
      },
    ],
  },
]

export const privateRoutes = [
  {
    path: '/menu',
    title: '菜单中心',
    name: '菜单中心',
    icon: 'icon-cdzx',
    component: () => import('@/containers/admin/menu'),
  },
  {
    path: '/permit',
    title: '权限管理',
    name: '权限管理',
    icon: 'icon-qxgl',
    children: [
      {
        path: '/role',
        title: '角色管理',
        name: '角色管理',
        component: () => import('@/containers/admin/permission/role'),
      },
      {
        path: '/user',
        title: '用户管理',
        name: '用户管理',
        exact: false,
        component: () => import('@/containers/admin/permission/user'),
      },
      {
        path: '/resource/:appCode',
        title: '资源管理',
        name: '资源管理',
        component: () => import('@/containers/admin/permission/resource'),
      },
      {
        path: '/resource',
        title: '资源管理',
        name: '资源管理',
        component: () => import('@/containers/admin/permission/resource'),
      },
      {
        path: '/data',
        title: '数据权限管理',
        name: '数据权限管理',
        component: () => import('@/containers/admin/permission/data'),
      },
      {
        path: '/log',
        title: '权限审计',
        name: '权限审计',
        component: () => import('@/containers/admin/permission/log'),
      },
    ],
  },
  {
    path: '/bi',
    title: 'BI工具',
    name: 'BI工具',
    icon: 'icon-bi',
    children: [
      {
        path: '/database/datasource',
        title: '数据源配置',
        name: '数据源配置',
        component: () => import('@/containers/bitools/database/datasource'),
      },
      {
        path: '/database/dataset',
        title: '数据集管理',
        name: '数据集管理',
        component: () => import('@/containers/bitools/database/dataset'),
      },
      {
        path: '/data-import',
        title: '数据导入',
        name: '数据导入',
        component: () => import('@/containers/bitools/dataImport'),
      },
      {
        path: '/list',
        title: '报表管理',
        name: '报表管理',
        component: () => import('@/containers/bitools/list'),
      },
      {
        path: '/createReport',
        title: '创建报表',
        name: '创建报表',
        hideInMenu: true,
        component: () => import('@/containers/bitools/createReport'),
      },
      {
        path: '/preview',
        title: '创建报表',
        name: '创建报表',
        hideInMenu: true,
        component: () => import('@/containers/bitools/preview'),
      },
      {
        path: '/dashboard',
        title: '仪表盘管理',
        name: '仪表盘管理',
        exact: true,
        component: () => import('@/containers/bitools/dashboard'),
      },
      {
        path: '/dashboard/editor',
        title: '编辑仪表盘',
        name: '编辑仪表盘',
        hideInMenu: true,
        component: () => import('@/containers/bitools/dashboard/editor'),
      },
    ],
  },
  {
    icon: 'icon-sjqx',
    path: '/data',
    title: '数据权限',
    name: '数据权限',
    hideInMenu: true,
    component: () => import('@/containers/data'),
  },
]

export const redirectRoutes = [
  // {
  //   path: '/404',
  //   component: '/redirect/no-match',
  //   title: 'no-match',
  // },
  // {
  //   path: '/403',
  //   component: '/redirect/unauthorized',
  //   title: 'unauthorized',
  // },
  // {
  //   path: '/500',
  //   component: '/redirect/server-error',
  //   title: 'no-match',
  // },
  // {
  //   path: '*',
  //   component: '/redirect/no-match-redirect',
  //   title: 'no-match-redirect',
  // },
]
