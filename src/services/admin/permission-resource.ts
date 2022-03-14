import { dcapi } from '@/utils/axios'

// 权限管理-资源管理-菜单列表
export function getResourceMenu (params) {
  return dcapi.get('/diana/resource/menuTree', { params })
}

// 权限管理-资源管理-资源列表
export function getResourceList (params): Promise<any> {
  return dcapi.post('/diana/resource/listMenuResource', params)
}

// 权限管理-资源管理-赋权给角色
export function getResourceRoleList (params): Promise<any> {
  const { menuId, resourceId, ...arg } = params
  if (menuId === resourceId) {
    const folderId = menuId
    return dcapi.get('/diana/resource/menu/roleList', { params: { ...arg, folderId } })
  }
  return dcapi.post('/diana/resource/resourceRoleList', params)
}

// 权限管理-资源管理-赋权给用户
export function getResourceUserList (params): Promise<any> {
  const { menuId, resourceId, ...arg } = params
  if (menuId === resourceId) {
    const folderId = menuId
    return dcapi.get('/diana/resource/menu/userList', { params: { ...arg, folderId } })
  }
  return dcapi.post('/diana/resource/resourceUserList', params)
}

export async function getResourceDatasetMenu (params = {}) {
  const data = await dcapi.get('/diana/resource/folderTree', { params })
  return data
}

export function getResourceDatasetList (params: {
  folderId: string
  businessDomainId?: string
  currentPage?: number
  pageSize?: number
  schemaTableName?: string
  [key: string]: any
}): Promise<any> {
  return dcapi.get('/diana/resource/listFile', { params })
}

export function getResourceRoleFileList (params: {
  fileId: string
  folderId: string
  nickName?: string
  currentPage?: number
}): Promise<any> {
  const { folderId, fileId, ...arg } = params
  if (folderId === fileId) {
    return dcapi.get('/diana/resource/folder/roleList', { params: { ...arg, folderId } })
  }
  return dcapi.get('/diana/resource/file/roleList', { params: { ...arg, fileId } })
}

export function getResourceUserFileList (params: {
  fileId: string
  folderId: string
  roleName?: string
  currentPage?: number
}): Promise<any> {
  const { folderId, fileId, ...arg } = params
  if (folderId === fileId) {
    return dcapi.get('/diana/resource/folder/userList', { params: { ...arg, folderId } })
  }
  return dcapi.get('/diana/resource/file/userList', { params: { ...arg, fileId } })
}

// 资源管理 BI空间树
export function getResourceBiGroupTree (params: {
  filterName?: string
  bizType: string
}): Promise<any> {
  return dcapi.post('/diana/resource/biGroupTree', params)
}

// 资源管理 角色列表
export function getResourceBiGroupRoleList (params: {
  groupId: string
  roleName?: string
  pageSize?: number
  currentPage: number
  onlyShowAuth: boolean
}): Promise<any> {
  return dcapi.get('/diana/resource/biGroupRoleList', { params })
}

// 资源管理 用户列表
export function getResourceBiGroupUserList (params: {
  groupId: string
  nickName?: string
  pageSize?: number
  currentPage: number
  onlyShowAuth: boolean
}): Promise<any> {
  return dcapi.get('/diana/resource/biGroupUserList', { params })
}
