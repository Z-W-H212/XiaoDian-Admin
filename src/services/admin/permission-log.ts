import { dcapi } from '@/utils/axios'

// 获取应用端列表
export async function getManageAppApi (): Promise<any> {
  const retData = await dcapi.get('/diana/user/fullauth/getManageApp')
  const ret = {}
  if (retData) {
    Object.keys(retData).forEach((key) => {
      ret[key.replace(/"/g, '')] = retData[key]
    })
  }
  return ret
}

// 获取全量部门
export async function getDeptAllApi (): Promise<any> {
  const retData = await dcapi.get('/diana/dept/all/tree')
  const ret = {}
  function flat (list) {
    if (!list || !list.length) return false
    list?.forEach((item) => {
      ret[item.key] = {
        text: item.title,
      }
      flat(item.children)
    })
  }
  flat(retData)
  return ret
}

// 模糊搜索部门
export function getDeptSearchApi (search): Promise<any> {
  return dcapi.get(`/diana/event/user/role/change/getDept/${search}`)
}

// 获取用户全量资源权限列表
export function getUserFullAuthListApi (
  params: {
    nickName?: string; // 用户花名
    status?: number; // 用户在职状态
    resourceName?: string; // 资源名称
    manageAppId?: number; // 应用端ID
    operator?: string; // 更新人
    minTime?: number; // 更新时间(毫秒值)
    maxTime?: number; // 更新时间(毫秒值)
    pageSize: number;
    currentPage: number;
  },
):Promise<any> {
  return dcapi.post('/diana/user/fullauth/userFullAuthList', params)
}

// 资源权限变更列表
export function getResourceAuthListApi (
  params: {
    appId?: number; // 应用端ID
    operateBeginTime?: number; // 开始时间 毫秒
    operateEndTime?: number; // 结束时间
    operator?: string; // 操作者
    optType?: number; // 操作类型  grant 赋权 ; cancel 取消赋权
    resourceBusinessType?: number; // 资源类型  2 数据集 ; 4 菜单资源 ; 5报表组
    menuResourceType?: number; // 菜单资源类型  1 报表; 2 仪表盘; 3 数据导入模板; 4 链接; 5 功能按钮 ; 7 接口
    resourceName?: string; // 资源名称
    targetName?: string; // 影响对象名称
    targetType?: string; // 影响对象类型
    pageSize: number;
    currentPage: number;
  },
): Promise<any> {
  return dcapi.post('/diana/event/resource/auth/list', params)
}

// 角色变更列表
export function getRoleChangeListApi (
  params: {
    deptId?: string; // 部门id
    operateBeginTime?: number; // 操作开始时间  毫秒
    operateEndTIme?: number; // 操作结束时间
    operator?: string; // 操作者
    roleSource?: string; // 变更类型
    userNickname?: string; // 用户昵称
    pageSize: number;
    currentPage: number;
  },
): Promise<any> {
  return dcapi.post('/diana/event/user/role/change/list', params)
}

// 数据权限变更日志
export function dataAuthChangeListApi (
  params: {
    dataAuthType?: string; // 类型  organization 组织架构； city_permission 城市
    deptId?: string; // 部门id
    operateBeginTime?: number; // 开始时间  毫秒
    operateEndTime?: number; // 结束时间
    operatorName?: string; // 操作用户名称
    userNickname?: string; // 用户昵称
    pageSize: number;
    currentPage: number;
  },
): Promise<any> {
  return dcapi.post('/diana/event/dataAuth/change/list', params)
}

// 获取用户行列权限
export function getUserColRowAuthApi (
  {
    userId,
    tableId,
    authType,
  }: {
    userId: string;
    tableId: string;
    authType: string;
  },
): Promise<any> {
  return dcapi.get(`/diana/user/fullauth/userColRowAuth/${userId}/${tableId}/${authType}`)
}

/* 下载  start */
// 获取用户全量资源权限列表
export function getUserFullAuthDownloadApi (
  params: {
    nickName?: string; // 用户花名
    status?: number; // 用户在职状态
    resourceName?: string; // 资源名称
    manageAppId?: number; // 应用端ID
    operator?: string; // 更新人
    minTime?: number; // 更新时间(毫秒值)
    maxTime?: number; // 更新时间(毫秒值)
  },
):Promise<any> {
  return dcapi.post('/diana/user/fullauth/download', params)
}

// 资源权限变更列表
export function getResourceAuthDownloadApi (
  params: {
    appId?: number; // 应用端ID
    operateBeginTime?: number; // 开始时间 毫秒
    operateEndTime?: number; // 结束时间
    operator?: string; // 操作者
    optType?: number; // 操作类型  grant 赋权 ; cancel 取消赋权
    resourceBusinessType?: number; // 资源类型  2 数据集 ; 4 菜单资源 ; 5报表组
    menuResourceType?: number; // 菜单资源类型  1 报表; 2 仪表盘; 3 数据导入模板; 4 链接; 5 功能按钮 ; 7 接口
    resourceName?: string; // 资源名称
    targetName?: string; // 影响对象名称
    targetType?: string; // 影响对象类型
  },
): Promise<any> {
  return dcapi.post('/diana/event/resource/auth/download', params)
}

// 角色变更列表
export function getRoleChangeDownloadApi (
  params: {
    deptId?: string; // 部门id
    operateBeginTime?: number; // 操作开始时间  毫秒
    operateEndTIme?: number; // 操作结束时间
    operator?: string; // 操作者
    roleSource?: string; // 变更类型
    userNickname?: string; // 用户昵称
  },
): Promise<any> {
  return dcapi.post('/diana/event/user/role/change/download', params)
}

// 数据权限变更日志
export function dataAuthChangeDownloadApi (
  params: {
    dataAuthType?: string; // 类型  organization 组织架构； city_permission 城市
    deptId?: string; // 部门id
    operateBeginTime?: number; // 开始时间  毫秒
    operateEndTime?: number; // 结束时间
    operatorName?: string; // 操作用户名称
    userNickname?: string; // 用户昵称
  },
): Promise<any> {
  return dcapi.post('/diana/event/dataAuth/change/download', params)
}
/* 下载  end */
