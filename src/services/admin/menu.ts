import { dcapi } from '@/utils/axios'

export function getAdminMenu () {
  return dcapi.get('/diana/menu/v1/menuList')
}

export function updateResourceMenuPath (params) {
  return dcapi.post('/diana/menu/moveResource', params)
}

// 获取报表资源列表
export function getReportList (params) {
  const { componentType, ...arg } = params
  if (componentType === 'interface') {
    delete arg.bizType
    return dcapi.post('/diana/menu/getInterfaceList', arg)
  }
  return dcapi.post('/diana/menu/getReportList', arg)
}

export function getMenuDetail (menuId) {
  return dcapi.get(`/diana/menu/menuInfo/${menuId}`)
}

// 获取报表资源列表
export function getDashboardList (params) {
  return dcapi.post('/diana/menu/getDashboardList', params)
}

/**
 * 新增菜单
 * @param
 */
export function addMenuList (params) {
  return dcapi.post('/diana/menu/addMenu', params)
}

/**
 * 编辑菜单
 * @param
 */
export function updateMenu (params) {
  return dcapi.post('/diana/menu/updateMenu', params)
}

/**
 * 移动菜单
 * @param
 */
export function updateMenuLevel (params) {
  return dcapi.post('/diana/menu/updateMenuLevel', params)
}

/**
 * 排序菜单
 * @param
 */
export function updateMenuSort (params) {
  return dcapi.post('/diana/menu/updateMenuSort', params)
}

/**
 * 删除菜单
 * @param
 */
export function removeMenu (params) {
  return dcapi.post(`/diana/menu/deleteMenu/${params.id}`)
}

/**
 * 添加按钮型菜单资源
 * @param
 */
export function addMenuButton (params) {
  return dcapi.post('/diana/menu/addButtonMenuResource', params)
}

/**
 * 添加数据导入菜单资源
 * @param
 */
export function addMenuDataImport (params) {
  return dcapi.post('/diana/menu/addDataExportResource', params)
}

/**
 * 添加接口-门户接口
 * @param
 */
export function addInnerInterfaceResource (params) {
  return dcapi.post('/diana/menu/addInnerInterfaceResource', params)
}

/**
 * 添加接口-外部接口
 * @param
 */
export function addOuterInterfaceResource (params) {
  return dcapi.post('/diana/menu/addOuterInterfaceResource', params)
}

/**
 * 编辑接口-外部接口
 * @param
 */
export function editOuterInterfaceMenuResource (params) {
  return dcapi.post('/diana/menu/editOuterInterfaceMenuResource', params)
}

/**
 * 添加报表菜单资源
 * @param
 */
export function addInterfaceResource (params) {
  return dcapi.post('/diana/menu/addReportResource', params)
}

/**
 * 添加报表菜单资源
 * @param
 */
export function addMenuReport (params) {
  return dcapi.post('/diana/menu/addReportResource', params)
}
/**
 * 添加报表菜单资源
 * @param
 */
export function addMenuDashboard (params) {
  return dcapi.post('/diana/menu/addDashboardMenuResource', params)
}

/**
 * 添加链接菜单资源
 * @param
 */
export function addMenuLink (params) {
  return dcapi.post('/diana/menu/addLinkMenuResource', params)
}

/**
 * 获取菜单资源列表
 * @param
 */
export function getMenuListResource (params) {
  return dcapi.post('/diana/menu/listMenuResource', params)
}
export function updateMenuListSort (params) {
  return dcapi.post('/diana/menu/updateResourceSort', params)
}

/**
 * 获取菜单资源列表
 * @param
 */
export function removeMenuResource (params) {
  return dcapi.post(`/diana/menu/deleteMenuResource/${params.id}`)
}

// 编辑按钮菜单资源
export function editMenuResouceButton (params) {
  return dcapi.post('/diana/menu/editButtonMenuResource', params)
}

// 编辑链接菜单资源
export function editMenuResouceLink (params) {
  return dcapi.post('/diana/menu/editLinkMenuResource', params)
}

// 获取应用列表
export function getAppListApi (params?): Promise<any> {
  return dcapi.get('/diana/menu/app/list', params)
}

// 获取应用对应的菜单列表
export function getAppMenuListApi (params) {
  return dcapi.get(`/diana/menu/menuList/${params.appCode}`)
}
// 编辑/添加应用
export function editAppListApi (params) {
  return dcapi.post('/diana/menu/app/edit', params)
}
// 删除应用
export function deleteAppApi (params) {
  return dcapi.post(`/diana/menu/app/delete/${params.appId}`)
}
