import { dcapi } from '@/utils/axios'

// 权限中心-用户管理-用户列表
export function getUserList (params) {
  return dcapi.post('/diana/user/list', params)
}

// 权限中心-用户管理-用户列表-删除（批量）
export function deleteUserBatch (params) {
  return dcapi.post('/diana/user/batchDeleteUser', params)
}

// 权限中心-用户管理-用户列表-添加用户-用户角色列表
export function getUserRoleList (params) {
  return dcapi.post('/diana/user/roleList', params)
}

// 权限中心-用户管理-用户列表-添加用户
export function addUserRoleList (params) {
  return dcapi.post('/diana/user/saveUser', params)
}

// 权限中心-用户管理-用户列表-编辑用户
export function updateUserRoleList (params) {
  return dcapi.post('/diana/user/updateUserRole', params)
}

// 权限中心-用户管理-角色外权配置-用户列表-新增
export function addExternalUser (userId) {
  return dcapi.post(`/diana/user/addMenuUser/${userId}`)
}

// 权限中心-用户管理-角色外权配置-用户列表-删除
export function deleteExternalUser (userId) {
  return dcapi.post(`/diana/user/deleteMenuUser/${userId}`)
}

// 权限中心-用户管理-角色外权配置-用户列表
export function getExternalUserList (userId) {
  return dcapi.get('/diana/user/listMenuUser')
}

// 权限中心-用户管理-角色外权配置-菜单列表（右侧）
export function getExternalMenuList (params) {
  return dcapi.post('/diana/user/menuTree', params)
}

// 权限中心-用户管理-角色外权配置-菜单列表（右侧）- 启用权限
export function setUserMenuEnable (params) {
  const { menuId, resourceId } = params
  if (menuId === resourceId) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return setUserMenuEnableNode(params)
  }
  return dcapi.post('/diana/user/addUserMenuAuth', params)
}

// 权限中心-用户管理-角色外权配置-菜单列表（右侧）- 禁用权限
export function setUserMenuDisable (params) {
  const { menuId, resourceId } = params
  if (menuId === resourceId) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return setUserMenuDisableNode(params)
  }
  return dcapi.post('/diana/user/cancelUserMenuAuth', params)
}
// 权限中心-用户管理-角色外权配置-菜单列表（右侧）- 启用权限（菜单）
export function setUserMenuEnableNode (params) {
  return dcapi.post('/diana/user/addUserMenu', params)
}

// 权限中心-用户管理-角色外权配置-菜单列表（右侧）- 禁用权限（菜单）
export function setUserMenuDisableNode (params) {
  return dcapi.post('/diana/user/cancelUserMenu', params)
}

// 权限中心-用户管理-用户二级授权-用户列表
export function getSubuserList (params) {
  return dcapi.get('/diana/user/secondUser/list', params)
}

// 权限中心-用户管理-用户二级授权-新增
export function addSubuser (userId) {
  return dcapi.post(`/diana/user/secondUser/addUser/${userId}`)
}

// 权限中心-用户管理-用户二级授权-删除
export function deleteSubuser (userId) {
  return dcapi.post(`/diana/user/secondUser/deleteUser/${userId}`)
}

// 权限中心-用户管理-用户二级授权-角色列表
export function getSubuserRoleList (params) {
  return dcapi.post('/diana/user/secondUser/listSelectedAuthRole', params)
}

// 权限中心-用户管理-用户二级授权-角色列表-新增角色-列表
export function getSubuserRoleListOptions (params) {
  return dcapi.post('/diana/user/secondUser/listAuthRole', params)
}

// 权限中心-用户管理-用户二级授权-角色列表-新增角色
export function addSubuserRoleList (params) {
  return dcapi.post('/diana/user/secondUser/addAuthRole', params)
}

// 权限中心-用户管理-用户二级授权-角色列表-删除
export function deleteSubuserRole (params) {
  return dcapi.post('/diana/user/secondUser/deleteAuthRole', params)
}

// 权限中心-用户管理-用户二级授权-用户列表
export function getSubuserUserList (params) {
  return dcapi.post('/diana/user/secondUser/listSelectedAuthUser', params)
}

// 权限中心-用户管理-用户二级授权-用户列表-删除
export function deleteSubuserUser (params) {
  return dcapi.post('/diana/user/secondUser/deleteAuthUser', params)
}

// 权限中心-用户管理-用户二级授权-用户列表-新增用户授权
export function addSubuserUser (params) {
  return dcapi.post('/diana/user/secondUser/addAuthUser', params)
}

export function getDepartmentList (params) {
  return dcapi.post('/diana/user/secondUser/listSelectedAuthDept', params)
}

export function addDepartmentList (params) {
  return dcapi.post('/diana/user/secondUser/addAuthDept', params)
}

export function deleteDepartmentList (params) {
  return dcapi.post('/diana/user/secondUser/deleteAuthDept', params)
}

// 赋予文件夹权限
export function addFolderUserAuth (params) {
  return dcapi.post('/diana/user/addUserFolderAuth', params)
}

// 取消文件夹权限
export function cancelFolderUserAuth (params) {
  return dcapi.post('/diana/user/cancelUserFolderAuth', params)
}

// 赋予文件权限
export function addFileUserAuth (params) {
  const { fileId, ...arg } = params
  if (arg.folderId === fileId) {
    return addFolderUserAuth(arg)
  }
  return dcapi.post('/diana/user/addUserFileAuth', params)
}

// 取消文件权限
export function cancelFileUserAuth (params) {
  const { fileId, ...arg } = params
  if (arg.folderId === fileId) {
    return cancelFolderUserAuth(arg)
  }
  return dcapi.post('/diana/user/cancelUserFileAuth', params)
}

export function getRowRule (params: {
  userId: string,
  schemaTableId: string,
}): Promise<string> {
  return dcapi.get('/diana/user/rowAuth', { params })
}

export function postRowRule (params: {
  userId: string,
  rule: string,
  schemaTableId: string,
}): Promise<string> {
  return dcapi.post('/diana/user/editRowAuth', params)
}

export function getColRule (params: {
  userId: string,
  schemaTableId: string,
}): Promise<{
  columnAlias: string
  columnId: string
  columnName: string
  permission: boolean
}[]> {
  return dcapi.get('/diana/user/columnAuth', { params })
}

export function postColRule (params: {
  userId: string,
  schemaTableColumnIds: string[],
  schemaTableId: string,
}): Promise<string> {
  return dcapi.post('/diana/user/columnAuth/edit', params)
}

// 角色权限树(只有folder)
export function getFolderTreeOnlyFolder (params: {
  filterName?: string,
  userId: string
}): Promise<any[]> {
  return dcapi.get('/diana/user/folderTree/onlyFolder', { params })
}

// 角色权限树 叶子部分分页
export function getFolderTreeFileList (params: {
  businessDomainId: string
  currentPage: number
  filterName: string
  folderId: string
  pageSize: number
  userId: string
}): Promise<any[]> {
  return dcapi.get('/diana/user/file/list/page', { params })
}

// 用户管理 BI空间树
export function getUserBiGroupTree (params: {
  targetId: string
  filterName: string
  bizType: string
}): Promise<any[]> {
  return dcapi.post('/diana/user/biGroupTree', params)
}

// 用户管理 BI空间 添加权限
export function addUserBiGroupFolderAuth (params: {
  userId: string
  authType: string
  folderId: string
}): Promise<any[]> {
  return dcapi.post('/diana/user/addUserBiGroupFolderAuth', params)
}

// 用户管理 BI空间 删除权限
export function cancelUserBiGroupFolderAuth (params: {
  userId: string
  authType: string
  folderId: string
}): Promise<any[]> {
  return dcapi.post('/diana/user/cancelUserBiGroupFolderAuth', params)
}
