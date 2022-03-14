import { dcapi } from '@/utils/axios'

// 权限管理-数据权限管理
export function getPermissionList (params) {
  return dcapi.post('/diana/data/permission/list', params)
}

// 权限管理-数据权限管理-获取用户权限
export function getPermissionUserRole (params) {
  return dcapi.post('/diana/data/permission/search', params)
}

// 权限管理-数据权限管理-保存用户权限
export function setPermissionUserRole (params) {
  return dcapi.post('/diana/data/permission/edit', params)
}

export function addPermissionUserRole (params) {
  return dcapi.post('/diana/data/permission/add', params)
}
// 权限管理-数据权限管理-删除用户权限
export function delPermissionUserRole (id) {
  return dcapi.post(`/diana/data/delete/${id}`)
}

// 权限管理-数据权限管理-获取部门权限
export function getAsyncTree (params) {
  return dcapi.post('/diana/data/permission/getByDepRpc', params)
}

export function getUserRoles (params) {
  return dcapi.get('/diana/data/permission/userRoles', params)
}

export function changeDataRole (params) {
  return dcapi.post('/diana/data/permission/changeDataRole', params)
}

// 获取地理城市列表
export function getCityPermission (params) {
  return dcapi.post('/diana/city/permission/list', params)
}

// 编辑用户权限
export function editRolePermission (params) {
  return dcapi.post('/diana/city/permission/update', params)
}

// 用户地理城市搜素
export function roleCitySearch (userId) {
  return dcapi.post(`/diana/city/permission/search/${userId}`)
}

// 获取用户拥有的城市权限
export function getRoleCityPermission () {
  return dcapi.get('/diana/city/permission/findUserCityPermission')
}

// 删除地理城市用户数据
export function deleteRoleCityPermission (id) {
  return dcapi.post(`/diana/city/permission/delete/${id}`)
}
