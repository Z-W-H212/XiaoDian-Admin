import { dcapi } from '@/utils/axios'

// 公共组件-根据部门ID取部门列表
export function getDepById (depId) {
  return dcapi.get(`/diana/role/depInfo/${depId}`)
}

// 公共组件-根据部门ID取部门下用户列表
export function getUserByDepId (depId) {
  return dcapi.get(`/diana/role/userInfo/${depId}`)
}

// 公共组件-搜索用户
export function getUserSearch (params) {
  return dcapi.get('/diana/user/findUser', { params })
}

// 权限管理-角色管理-角色列表
export function getRoleList () {
  return dcapi.get('/diana/role/list')
}

// 权限管理-角色管理-新增角色
export function addRole (params) {
  return dcapi.post('/diana/role/addRole', params)
}

// 权限管理-角色管理-更新角色
export function updateRole (params) {
  return dcapi.post('/diana/role/editRole', params)
}

// 权限管理-角色管理-删除角色
export function deleteRole (roleId) {
  return dcapi.post(`/diana/role/deleteRole/${roleId}`)
}

// 权限管理-角色管理-用户列表
export function getRoleUserList (params) {
  return dcapi.post('/diana/role/authUserList', params)
}

// 权限管理-角色管理-用户列表-创建用户
export function addRoleUser (params) {
  return dcapi.post('/diana/role/addRoleUser', params)
}

// 权限管理-角色管理-用户列表-删除用户
export function deleteRoleUser (params) {
  return dcapi.post('/diana/role/deleteUserRole', params)
}

// 权限管理-角色管理-菜单权限
export function getRoleMenuList (params) {
  return dcapi.post('/diana/role/menuTree', params)
}

// 权限管理-角色管理-菜单权限-启用(针对资源)
export function setRoleMenuEnable (params) {
  const { menuId, resourceId } = params
  if (menuId === resourceId) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return setRoleMenuEnableNode(params)
  }
  return dcapi.post('/diana/role/addRoleMenuAuth', params)
}

// 权限管理-角色管理-菜单权限-禁用(针对资源)
export function setRoleMenuDisable (params) {
  const { menuId, resourceId } = params
  if (menuId === resourceId) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return setRoleMenuDisableNode(params)
  }
  return dcapi.post('/diana/role/cancelRoleMenuAuth', params)
}

// 针对菜单
export function setRoleMenuEnableNode (params) {
  return dcapi.post('/diana/role/addRoleMenu', params)
}

// 针对菜单
export function setRoleMenuDisableNode (params) {
  return dcapi.post('/diana/role/cancelRoleMenu', params)
}

// 权限管理-角色管理-部门列表-获取部门
export function getDepartmentList (params) {
  return dcapi.post('/diana/role/depForOp', params)
}

export function addRoleDepartment (params) {
  return dcapi.post('/diana/role/authDept/add', params)
}

export function getRoleDepartment (params) {
  return dcapi.post('/diana/role/authDept/list', params)
}

export function deleteRoleDepartment (params) {
  return dcapi.post('/diana/role/authDept/cancel', params)
}

// 赋予文件夹权限
export function addFolderRoleAuth (params) {
  return dcapi.post('/diana/role/addRoleFolderAuth', params)
}

// 取消文件夹权限
export function cancelFolderRoleAuth (params) {
  return dcapi.post('/diana/role/cancelRoleFolderAuth', params)
}

// 赋予文件权限
export function addFileRoleAuth (params) {
  const { fileId, ...arg } = params
  // 新增文件夹授权，如果选择文件夹的时候fileId会等于folderId
  if (arg.folderId !== fileId) {
    arg.fileId = fileId
    return dcapi.post('/diana/role/addRoleFileAuth', arg)
  }
  return addFolderRoleAuth(arg)
}

// 取消文件权限
export function cancelFileRoleAuth (params) {
  const { fileId, ...arg } = params
  if (arg.folderId !== fileId) {
    arg.fileId = fileId
    return dcapi.post('/diana/role/cancelRoleFileAuth', arg)
  }
  return cancelFolderRoleAuth(arg)
}

export function getRowRule (params: {
  roleId: string,
  schemaTableId: string,
}): Promise<string> {
  return dcapi.get('/diana/role/rowAuth', { params })
}

export function postRowRule (params: {
  roleId: string,
  rule: string,
  schemaTableId: string,
}): Promise<string> {
  return dcapi.post('/diana/role/editRowAuth', params)
}

export function getColRule (params: {
  roleId: string,
  schemaTableId: string,
}): Promise<{
  columnAlias: string
  columnId: string
  columnName: string
  permission: boolean
}[]> {
  return dcapi.get('/diana/role/columnAuth', { params })
}

export function postColRule (params: {
  roleId: string,
  schemaTableColumnIds: string[],
  schemaTableId: string,
}): Promise<string> {
  return dcapi.post('/diana/role/columnAuth/edit', params)
}

// 角色权限树(只有folder)
export function getFolderTreeOnlyFolder (params: {
  filterName?: string,
  roleId: string
}): Promise<any[]> {
  return dcapi.get('/diana/role/folderTree/onlyFolder', { params })
}

// 角色权限树 叶子部分分页
export function getFolderTreeFileList (params: {
  businessDomainId: string
  currentPage: number
  filterName: string
  folderId: string
  pageSize: number
  roleId: string
}): Promise<any[]> {
  return dcapi.get('/diana/role/file/list/page', { params })
}

// 角色管理 BI空间树
export function getBiGroupTree (params: {
  targetId: string
  filterName: string
  bizType: string
}): Promise<any[]> {
  return dcapi.post('/diana/role/biGroupTree', params)
}

// 角色管理 BI空间 添加权限
export function addRoleBiGroupFolderAuth (params: {
  roleId: string
  authType: string
  folderId: string
}): Promise<any[]> {
  return dcapi.post('/diana/role/addRoleBiGroupFolderAuth', params)
}

// 角色管理 BI空间 删除权限
export function cancelRoleBiGroupFolderAuth (params: {
  roleId: string
  authType: string
  folderId: string
}): Promise<any[]> {
  return dcapi.post('/diana/role/cancelRoleBiGroupFolderAuth', params)
}
